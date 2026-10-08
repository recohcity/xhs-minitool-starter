# 校准案例

以下案例用于校准判断，均为虚构演练，不代表真实公司或市场数据。

## 案例一：500 人候补的 AI 会议助手

### 已知事实

- 创始人发布概念页，获得 500 个邮箱注册。
- 评论集中在“很酷”“上线提醒我”。
- 没有访谈最近一次会议处理过程，也不知道注册者当前如何整理会议。
- 没有原型、使用、迁移或付款。

### 评分

```json
{
  "product": "AI 会议助手",
  "stage": "idea",
  "demand": {
    "specific_person_scene": 1,
    "progress_consequence": 1,
    "workaround_cost": 0,
    "recurrence": 1,
    "urgency": 0
  },
  "solution": {
    "mechanism": 0,
    "unassisted_use": 0,
    "observed_outcome": 0,
    "beats_status_quo": 0,
    "repeat_choice": 0
  },
  "commitment_level": 0,
  "payment_evidence": 0
}
```

### 结论

判定“证据不足”。500 个注册属于兴趣信号，尚未证明存在同一种高代价任务。下一步观察 5 位注册者最近一次会议后的真实流程，再为出现重复绕路的人手工交付一份结果，并要求提交原始材料和预约时间。

## 案例二：跨境商品合规检查

### 已知事实

- 6 位同类商家每周都要把商品信息复制到多个表格并人工核对，平均花费 3 小时。
- 错误可能导致商品下架，触发明确且后果可见。
- 原型允许商家导入现有数据，无辅助完成检查，并把平均处理时间降到 35 分钟。
- 4 位商家连续使用 5 周，其中 3 位按正常价格续费。

### 评分

```json
{
  "product": "跨境商品合规检查器",
  "stage": "paying",
  "demand": {
    "specific_person_scene": 2,
    "progress_consequence": 2,
    "workaround_cost": 3,
    "recurrence": 3,
    "urgency": 2
  },
  "solution": {
    "mechanism": 2,
    "unassisted_use": 2,
    "observed_outcome": 3,
    "beats_status_quo": 2,
    "repeat_choice": 3
  },
  "commitment_level": 6,
  "payment_evidence": 3
}
```

### 结论

判定“重复需求已验证”，范围只限于当前商家与合规检查场景。下一阶段可以验证获客成本、交付成本和相邻商品类别，不能直接宣布整个跨境电商市场已经得到验证。

## 案例三：免费情绪记录工具

### 已知事实

- 用户原先每天在多个聊天窗口和备忘录里记录情绪，找回历史记录困难。
- 8 位用户独立完成迁移，使用后能在一次搜索中找回相关记录。
- 5 位用户连续使用 8 周，并主动推荐给朋友。
- 产品从未收费，也没有做过付费测试。

### 评分

```json
{
  "product": "情绪记录工具",
  "stage": "users",
  "demand": {
    "specific_person_scene": 2,
    "progress_consequence": 2,
    "workaround_cost": 2,
    "recurrence": 3,
    "urgency": 1
  },
  "solution": {
    "mechanism": 2,
    "unassisted_use": 2,
    "observed_outcome": 2,
    "beats_status_quo": 2,
    "repeat_choice": 3
  },
  "commitment_level": 6,
  "payment_evidence": 0
}
```

### 结论

判定“重复需求已验证”，商业证据仍为“未测试付费”。持续使用能证明产品在当前场景解决了问题，不能证明用户愿意为它付款。

## 案例四：功能不错但替代方案更顺手

### 已知事实

- 设计师经常需要压缩图片，需求和频率都真实。
- 新工具能够完成压缩，测试用户也能独立使用。
- 新工具要求注册、上传和配置；系统自带工具一步即可完成，速度更快。
- 测试结束后，用户全部回到系统工具。

### 结论

即使需求真实性分数很高，也应判“需求存在，当前方案未解决”。断点在产品没有胜过现状，继续添加与压缩无关的功能不会修复这个问题。
