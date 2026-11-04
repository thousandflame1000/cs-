=== os-process 1
```fig
graph
nodes: 新建@0,0 就緒@1,1 執行*@3,1 等待@2,2 結束@4,0
edges: 新建>就緒:允許 就緒-執行:派遣⇄中斷 執行>等待:等I/O 等待>就緒:I/O好了 執行>結束:exit
cap: 行程的五種狀態：「執行」被中斷就回到「就緒」排隊；等 I/O 就進「等待」，等到了也是先回「就緒」
```

=== os-process 2
```fig
tree
P*(C1(C3),C2)
cap: 連續兩次 fork()：第一次 P 生出 C1；第二次 P 和 C1 各再生一個 → 總共 4 個行程。每個行程都從 fork 的下一行繼續
```

=== os-process 3
```fig
array
row 同一行程的執行緒共用: 程式碼 全域資料 heap 開啟的檔案
row 每個執行緒各自一份: 暫存器* PC* 堆疊*
cap: 執行緒共用大部分東西，所以切換便宜；但「堆疊」各自一份，區域變數不會互相蓋掉
```

=== os-process 4
```fig
flow: 使用者程式（user mode） -> 系統呼叫：trap -> 核心模式做事* -> 回到 user mode
cap: 特權指令（關中斷、設計時器、直接做 I/O）只能在核心模式執行；使用者程式要靠 trap 請 OS 幫忙
```

=== os-process 5
```fig
array
row 共享記憶體: 建好後很快+ 同步自己負責!
row 訊息傳遞: 每次都經過核心! 核心幫你同步+
cap: 行程間通訊的兩種方式：大量資料用共享記憶體；少量、跨機器用訊息傳遞
```

=== os-sched 1
```fig
timeline P: · 2 | 等待! 3 | 執行* 4 | · 1
cap: 到達 2、開始 5、完成 9：等待時間 3、回應時間 3、周轉時間 9 − 2 = 7
```

=== os-sched 2
```fig
timeline FCFS: P1 5 | P2 3 | P3+ 1
timeline RR（q=2）: P1 2 | P2 2 | P3+ 1 | P1 2 | P2 1 | P1 1
cap: 三個工作同時到達。RR 每人輪流跑一個時間片：最短的 P3 在第 5 秒就做完（FCFS 要等到第 9 秒）
```

=== os-sched 3
```fig
bars
bar RM，1 個工作: 100 100%
bar RM，2 個工作: 82.8 82.8%
bar RM，3 個工作: 78 78.0%
bar RM，很多個工作: 69.3 約 69.3%（ln 2）!
bar EDF: 100 100% +
cap: 使用率不超過這條線就保證排得出來：RM 的保證隨工作數下降到 ln 2；EDF 只要 U ≤ 100% 就可以
```

=== os-sched 4
```fig
array
row 處理器親和性: 留在原本的CPU+ cache還是熱的+
row 負載平衡: 搬到比較閒的CPU+ cache要重新熱!
cap: 多處理器排程的拉扯：搬家可以分攤工作，但 cache 裡的資料就白費了
```

=== os-sync 1
```fig
array
row 互斥: 同時最多一個人在裡面
row 進展: 沒人在裡面時，想進的人很快決定出來
row 有限等待: 排隊時不會被無限次插隊
cap: 臨界區問題的解法要三條都滿足；只做到互斥還不夠
```

=== os-sync 2
```fig
flow: flag[i] = true（我想進） -> turn = j（但先讓你） -> 你也想進、而且輪到你？ -> 是：等!  | 否：進臨界區+
cap: Peterson：兩個人都想進時，最後寫 turn 的那個人讓出去，所以只有一個人進得去
```

=== os-sync 3
```fig
flow: test_and_set(&lock) -> 原子地讀出舊值、再設成 true -> 舊值是 false：拿到鎖+ | 舊值是 true：再試一次!
cap: 硬體保證「讀」和「寫」中間不會被插隊；但最簡單的版本不保證有限等待
```

=== os-sync 4
```fig
array
row 動作: 開始 P1等 P2等 P3等 P1放
row S 的值: 1 0 −1! −2! −1
cap: 號誌 S 初值 1。值是負的時候，絕對值 = 正在排隊的人數（−2 代表兩個人在等）；P1 放開後叫醒一個
```

=== os-sync 5
```fig
flow: x.wait() -> 睡覺，並且放開監視器 -> 別人呼叫 x.signal() -> 叫醒一個正在等的（沒人等就什麼都不做）*
cap: 條件變數和號誌最大的差別：signal 不會被「存起來」
```

=== os-sync 6
```fig
timeline L（低）: L 3 | · 5 | L* 1 | · 2
timeline M（中）: · 3 | M 5 | · 3
timeline H（高）: · 2 | 等鎖! 7 | H 2
cap: Priority inversion：H 要的鎖在 L 手上，M 卻一直搶走 L 的 CPU → H 被不相干的 M 卡住。解法：L 拿著鎖時暫時繼承 H 的優先權
```

=== os-deadlock 1
```fig
graph
nodes: P1@0,1 R2@1,0 P2@2,1 R1@1,2
edges: R1>P1:給了* P1>R2:要* R2>P2:給了* P2>R1:要*
cap: P1 拿著 R1 要 R2，P2 拿著 R2 要 R1：繞成一圈。每種資源只有一個時，有環就是死結
```

=== os-deadlock 2
```fig
flow: 怎麼對付死結 -> 預防 | 避免 | 偵測＋復原 | 忽略 -> 打破四個必要條件之一 | 每次給之前先檢查安全（Banker） | 定期找環，再殺行程或搶資源 | 鴕鳥法：當作不會發生（多數 OS）
cap: 四種策略，越往下越不囉嗦，但也越不保險
```

=== os-deadlock 3
```fig
flow: Work = Available -> 找一個 Need ≤ Work 的行程 -> 讓它做完：Work 加上它手上的 -> 全部都能做完 → 安全*
cap: 安全演算法：只要找得到一個順序讓每個行程都做完，就是安全狀態
```

=== os-deadlock 4
```fig
array
row 殺行程: 全部殺 一次殺一個（每次重新檢查）
row 搶資源: 選成本最小的犧牲者 rollback 別讓同一個一直被選!
cap: 偵測到死結之後的兩條路
```

=== os-memory 1
```fig
flow: CPU 給的邏輯位址 346 -> ＋ 重定位暫存器 14000 -> 實體位址 14346*
cap: 執行時期繫結：MMU 每次存取都加上 base，所以行程可以被搬到別的地方
```

=== os-memory 2
```fig
array
row 記憶體: OS 用 洞20K 用 洞10K* 用 洞12K
cap: 要一塊 9K：first-fit 選 20K（第一個夠大的）、best-fit 選 10K（最剛好的）、worst-fit 選 20K（最大的）
```

=== os-memory 3
```fig
bits: 頁號 20 | 頁內位移 12*
cap: 頁大小 4 KB = 2¹² → 位址的低 12 位是頁內位移。例：0x12345 → 頁號 0x12、位移 0x345，查頁表換掉頁號就好
```

=== os-memory 4
```fig
flow: （PID, 頁號） -> 雜湊，或搜尋整張反轉頁表 -> 在第 i 項找到 -> 實體頁框就是 i*
cap: 反轉頁表：每個實體頁框一項，全系統只有一張，很省空間；代價是查詢要搜尋（用雜湊加速）
```

=== os-memory 5
```fig
flow: （段 2, 位移 53） -> 查段表：base 4300、limit 400 -> 53 < 400？ -> 是：實體位址 4353+ | 否：trap，存取違規!
cap: 分段：位移超過 limit 就是越界；每一段大小不同，所以會有外部碎片
```

=== os-vm 1
```fig
flow: 存取一頁 -> valid = 0 → trap 給 OS -> 找空頁框（沒有就換掉一頁） -> 從磁碟讀進來 -> 更新頁表 -> 重新執行那條指令*
cap: Page fault 的處理流程：最後一步很重要，是「重新執行」而不是跳過
```

=== os-vm 2
```fig
array
row 參考: 7 0 1 2 0 3 0 4
row LRU: ✗! ✗! ✗! ✗! · ✗! · ✗!
cap: LRU（3 個頁框）：換掉最久沒用的那一頁。✗ = 缺頁，這 8 次裡缺頁 6 次
```

=== os-vm 3
```fig
bars
bar 2 個行程: 40
bar 4 個行程: 70
bar 6 個行程: 85
bar 8 個行程: 90 *
bar 10 個行程: 30 thrashing!
cap: （示意）CPU 使用率：行程越多越忙，直到每個分到的頁框不夠 → 一直缺頁、CPU 都在等磁碟，突然掉下來
```

=== os-vm 4
```fig
array
row 一列一列走: 每頁走完再換 128次缺頁+
row 一行一行走: 每一步都換頁 16384次缺頁!
cap: int data[128][128]、一列剛好一頁、頁框很少：走訪的順序對，缺頁次數差 128 倍
```

=== os-storage 1
```fig
array
row SSTF 順序: 53* 65 67 37 14 98 122 124 183
cap: 磁頭在 53，佇列 98、183、37、122、14、124、65、67。SSTF 每次找最近的：總移動 236 柱面（FCFS 照順序走要 640）
```

=== os-storage 2
```fig
array
row 碟 1: A1 B1 C1 P*
row 碟 2: A2 B2 P* D1
row 碟 3: A3 P* C2 D2
row 碟 4: P* B3 C3 D3
cap: RAID 5：每一條（A、B、C、D）的同位元 P 輪流放在不同的碟。壞一顆可以用其他的 XOR 算回來；n 顆的可用容量是 n − 1 顆
```

=== os-storage 3
```fig
array
row 連續配置: 1 2 3 4
row 鏈結配置: 9 -> 16 -> 1 -> 10
row 索引配置: 索引塊：9、16、1、10*
cap: 同一個 4 塊的檔案三種放法：連續（隨機存取快、會有外部碎片）、鏈結（只能一塊一塊跟著走）、索引（一個區塊記下所有位置）
```

=== os-storage 4
```fig
array
row bitmap: 0 0 1* 1* 0 1* 1* 1*
idx: 0 1 2 3 4 5 6 7
cap: 每個區塊一個位元（1 = 空閒）。1 TB 的磁碟、4 KB 的區塊 → 2²⁸ 個區塊 → bitmap 要 2²⁸ 位元 = 32 MB
```

=== os-storage 5
```fig
flow: 要改 metadata -> 先寫進日誌 -> commit -> 再真正改檔案系統 -> 當機了？只重放已經 commit 的*
cap: 日誌式檔案系統：當機後不用整顆 fsck，重放日誌就好
```
