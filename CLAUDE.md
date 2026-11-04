# CLAUDE.md

這是資工所（目標台大）學習網站，Agent 的工作規則全部寫在 **AGENTS.md**，請先讀完再動作。

最常用的三件事：

- 學生說「監聽」：重複執行 `python agent.py watch --timeout 100`，依 AGENTS.md 第 4 節處理每則訊息後再繼續監聽，直到學生說停止。
- 學生說「督導」或每日排程觸發：依 AGENTS.md 第 6 節執行每日督導。
- 審費曼關卡前，一定先 `python agent.py lesson <章節id>` 讀教材與 rubric；思考鏈有缺口就退回並追問，不要直接給答案。

回覆一律使用繁體中文（台灣）。
