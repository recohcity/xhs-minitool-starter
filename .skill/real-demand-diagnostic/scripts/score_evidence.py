#!/usr/bin/env python3
"""Score real-demand evidence without replacing qualitative judgment."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


STAGES = {"idea", "prototype", "users", "paying"}
DEMAND_RANGES = {
    "specific_person_scene": (0, 2),
    "progress_consequence": (0, 2),
    "workaround_cost": (0, 3),
    "recurrence": (0, 3),
    "urgency": (0, 2),
}
SOLUTION_RANGES = {
    "mechanism": (0, 2),
    "unassisted_use": (0, 2),
    "observed_outcome": (0, 3),
    "beats_status_quo": (0, 2),
    "repeat_choice": (0, 3),
}

VERDICT_LABELS = {
    "insufficient-evidence": "证据不足",
    "weak-demand": "需求过弱／疑似伪需求",
    "demand-candidate-solution-untested": "真需求候选，方案未证",
    "need-exists-solution-not-fit": "需求存在，当前方案未解决",
    "solution-works-repeat-untested": "方案有效，重复选择未证",
    "strong-scene-provisional": "强场景初步成立",
    "repeat-demand-validated": "重复需求已验证",
}

RECOMMENDATIONS = {
    "insufficient-evidence": "暂停增加功能，先找到最近一次真实事件和当前绕路。",
    "weak-demand": "停止按当前假设扩建，重新寻找已经付出代价的人群或场景。",
    "demand-candidate-solution-untested": "用数天内可交付的最窄方案测试资料、时间、迁移或付款承诺。",
    "need-exists-solution-not-fit": "保留需求判断，修正机制或场景，不继续堆功能。",
    "solution-works-repeat-untested": "停止看首轮好评，测试下一次相同场景是否再次选择。",
    "strong-scene-provisional": "继续深挖同一窄场景，扩大跨人跨时重复证据。",
    "repeat-demand-validated": "保留当前场景，下一阶段再验证获客、价格和单位经济。",
}


class EvidenceError(ValueError):
    """Raised when an evidence file does not follow the rubric schema."""


def _validate_scores(section_name: str, values: Any, ranges: dict[str, tuple[int, int]]) -> dict[str, int]:
    if not isinstance(values, dict):
        raise EvidenceError(f"{section_name} must be an object")
    missing = [key for key in ranges if key not in values]
    if missing:
        raise EvidenceError(f"{section_name} missing fields: {', '.join(missing)}")

    result: dict[str, int] = {}
    for key, (minimum, maximum) in ranges.items():
        value = values[key]
        if isinstance(value, bool) or not isinstance(value, int):
            raise EvidenceError(f"{section_name}.{key} must be an integer")
        if not minimum <= value <= maximum:
            raise EvidenceError(
                f"{section_name}.{key} must be between {minimum} and {maximum}"
            )
        result[key] = value
    return result


def _validate_level(name: str, value: Any, minimum: int, maximum: int) -> int:
    if isinstance(value, bool) or not isinstance(value, int):
        raise EvidenceError(f"{name} must be an integer")
    if not minimum <= value <= maximum:
        raise EvidenceError(f"{name} must be between {minimum} and {maximum}")
    return value


def diagnose(payload: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise EvidenceError("root value must be an object")

    product = payload.get("product")
    if not isinstance(product, str) or not product.strip():
        raise EvidenceError("product must be a non-empty string")

    stage = payload.get("stage")
    if stage not in STAGES:
        raise EvidenceError(f"stage must be one of: {', '.join(sorted(STAGES))}")

    demand = _validate_scores("demand", payload.get("demand"), DEMAND_RANGES)
    solution = _validate_scores("solution", payload.get("solution"), SOLUTION_RANGES)
    commitment = _validate_level("commitment_level", payload.get("commitment_level"), 0, 6)
    payment = _validate_level("payment_evidence", payload.get("payment_evidence"), 0, 3)

    demand_total = sum(demand.values())
    solution_total = sum(solution.values())
    gates: list[str] = []

    if demand["specific_person_scene"] < 2:
        verdict = "insufficient-evidence"
        gates.append("缺少一个真实的人与近期发生的具体场景")
    elif demand_total <= 4 or (commitment == 0 and demand["workaround_cost"] <= 1):
        verdict = "weak-demand"
        gates.append("只有态度信号，缺少已经付出代价的行为")
    elif stage == "idea" or solution["unassisted_use"] == 0:
        verdict = "demand-candidate-solution-untested"
        gates.append("尚无真实、无辅助的产品使用")
    elif solution["beats_status_quo"] == 0 or solution_total <= 4 or solution["observed_outcome"] <= 1:
        verdict = "need-exists-solution-not-fit"
        if solution["beats_status_quo"] == 0:
            gates.append("当前方案没有胜过用户原有替代办法")
        if solution["observed_outcome"] <= 1:
            gates.append("使用后结果变化尚未被观察或不可感知")
    elif solution["repeat_choice"] <= 1 or commitment <= 3:
        verdict = "solution-works-repeat-untested"
        gates.append("首轮使用存在信号，但重复选择与高成本承诺不足")
    elif (
        demand_total >= 9
        and solution_total >= 9
        and solution["repeat_choice"] == 3
        and commitment == 6
    ):
        verdict = "repeat-demand-validated"
    else:
        verdict = "strong-scene-provisional"

    commercial_status = {
        0: "未测试付费",
        1: "只有模糊或一次性低强度付款",
        2: "已有一次正常条件付款",
        3: "已有重复付费／续费／复购",
    }[payment]

    if demand_total <= 4:
        demand_strength = "弱"
    elif demand_total <= 8:
        demand_strength = "中"
    else:
        demand_strength = "强"

    if stage == "idea":
        solution_strength = "未测"
    elif solution_total <= 4:
        solution_strength = "弱"
    elif solution_total <= 8:
        solution_strength = "中"
    else:
        solution_strength = "强"

    return {
        "product": product.strip(),
        "stage": stage,
        "verdict": verdict,
        "verdict_label": VERDICT_LABELS[verdict],
        "demand_score": {"value": demand_total, "max": 12, "strength": demand_strength},
        "solution_score": {"value": solution_total, "max": 12, "strength": solution_strength},
        "commitment_level": commitment,
        "commercial_status": commercial_status,
        "hard_gates": gates,
        "recommendation": RECOMMENDATIONS[verdict],
        "warning": "分数只用于定位证据断点；原始行为证据和否决条件优先。",
    }


def render_markdown(result: dict[str, Any]) -> str:
    gates = result["hard_gates"]
    gate_text = "；".join(gates) if gates else "无"
    return "\n".join(
        [
            f"# {result['product']}｜真需求证据评分",
            "",
            f"- 当前判定：{result['verdict_label']}",
            f"- 需求真实性：{result['demand_score']['value']} / 12（{result['demand_score']['strength']}）",
            f"- 方案有效性：{result['solution_score']['value']} / 12（{result['solution_score']['strength']}）",
            f"- 最强行为承诺：E{result['commitment_level']}",
            f"- 商业证据：{result['commercial_status']}",
            f"- 否决条件：{gate_text}",
            f"- 下一步：{result['recommendation']}",
            "",
            f"> {result['warning']}",
        ]
    )


def _configure_stdio() -> None:
    """Keep Chinese CLI output readable in redirected Windows terminals."""
    for stream in (sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)
        if reconfigure is not None:
            reconfigure(encoding="utf-8")


def main() -> int:
    _configure_stdio()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("evidence_file", type=Path, help="JSON evidence file")
    parser.add_argument("--format", choices=("markdown", "json"), default="markdown")
    args = parser.parse_args()

    try:
        payload = json.loads(args.evidence_file.read_text(encoding="utf-8"))
        result = diagnose(payload)
    except (OSError, json.JSONDecodeError, EvidenceError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2

    if args.format == "json":
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(render_markdown(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
