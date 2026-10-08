import importlib.util
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "score_evidence.py"
SPEC = importlib.util.spec_from_file_location("score_evidence", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(MODULE)


def payload(
    *,
    product="测试产品",
    stage="idea",
    demand=(0, 0, 0, 0, 0),
    solution=(0, 0, 0, 0, 0),
    commitment=0,
    payment=0,
):
    return {
        "product": product,
        "stage": stage,
        "demand": dict(zip(MODULE.DEMAND_RANGES, demand)),
        "solution": dict(zip(MODULE.SOLUTION_RANGES, solution)),
        "commitment_level": commitment,
        "payment_evidence": payment,
    }


class DiagnoseTests(unittest.TestCase):
    def test_waitlist_is_not_demand(self):
        result = MODULE.diagnose(
            payload(demand=(1, 1, 0, 1, 0), commitment=0)
        )
        self.assertEqual(result["verdict"], "insufficient-evidence")

    def test_strong_repeated_paid_use(self):
        result = MODULE.diagnose(
            payload(
                stage="paying",
                demand=(2, 2, 3, 3, 2),
                solution=(2, 2, 3, 2, 3),
                commitment=6,
                payment=3,
            )
        )
        self.assertEqual(result["verdict"], "repeat-demand-validated")
        self.assertEqual(result["demand_score"]["value"], 12)
        self.assertEqual(result["solution_score"]["value"], 12)

    def test_free_repeat_use_keeps_payment_separate(self):
        result = MODULE.diagnose(
            payload(
                stage="users",
                demand=(2, 2, 2, 3, 1),
                solution=(2, 2, 2, 2, 3),
                commitment=6,
                payment=0,
            )
        )
        self.assertEqual(result["verdict"], "repeat-demand-validated")
        self.assertEqual(result["commercial_status"], "未测试付费")

    def test_status_quo_gate_overrides_total(self):
        result = MODULE.diagnose(
            payload(
                stage="users",
                demand=(2, 2, 3, 3, 2),
                solution=(2, 2, 3, 0, 3),
                commitment=6,
                payment=0,
            )
        )
        self.assertEqual(result["verdict"], "need-exists-solution-not-fit")

    def test_invalid_score_is_rejected(self):
        bad = payload()
        bad["demand"]["urgency"] = 3
        with self.assertRaises(MODULE.EvidenceError):
            MODULE.diagnose(bad)


if __name__ == "__main__":
    unittest.main()
