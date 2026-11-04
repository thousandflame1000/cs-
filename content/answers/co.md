=== rc:co-perf:1
CPU 時間 = 指令數 × CPI × 時脈週期。
- 指令數：演算法、程式語言、編譯器、ISA。
- CPI：演算法、程式語言、編譯器、ISA、組織（微架構）。
- 時脈週期：ISA、組織、製程技術。

=== rc:co-perf:2
MIPS = 指令數 ÷（時間 × $10^6$），完全不管每道指令做了多少事。例：B 用很多簡單指令（指令數是 A 的 2 倍），CPI 比較低，所以 MIPS 比較高，但總時間反而比較長。編譯器把指令數減少，MIPS 會下降，程式卻變快。

=== rc:co-perf:3
SPEC ratio = 參考機時間 ÷ 受測機時間。用幾何平均時，換哪台當參考機，所有比值只是乘上同一個常數，排名不變；算術平均會因為參考機不同而改變排名。

=== rc:co-perf:4
- Amdahl：問題大小固定。加速比 $\frac{1}{(1-f)+f/s}$，上限 $\frac{1}{1-f}$。
- Gustafson：處理器越多，就把問題做得越大，執行時間固定。加速比 $(1-f)+f\cdot N$，隨 N 線性增加。

=== rc:co-perf:5
$P=\alpha\cdot C\cdot V^2\cdot f$（活動因子 × 電容 × 電壓² × 頻率）。電壓是平方，而且降電壓通常也得降頻率，兩個一起降，功率大約隨 $V^3$ 下降；只降頻率只是線性下降。

=== rc:co-arith:1
範圍 $-2^{n-1}$ ～ $2^{n-1}-1$（4 位元：−8 ～ 7）。
- 有號加法溢位：兩個同號數相加，結果卻是相反的符號（等價：進到最高位的進位 ≠ 從最高位出去的進位）。
- 無號加法溢位：最高位有進位出去。

=== rc:co-arith:2
$g_i=a_ib_i$（自己產生進位）、$p_i=a_i+b_i$（把下面的進位傳上去）。
$c_{i+1}=g_i+p_ic_i$，展開：$c_2=g_1+p_1g_0+p_1p_0c_0$……每個進位都只用 g、p、$c_0$ 算，兩層邏輯就好，不用一位一位等。

=== rc:co-arith:3
看目前這位和右邊一位 $(q_i,q_{i-1})$：
- 10：減被乘數；01：加被乘數；00、11：不動。
- 然後整個算術右移一位。

Radix-4：一次看 3 個位元、一次處理 2 位，部分積的數量少一半（只會加 0、±M、±2M）。

=== rc:co-arith:4
單精度：符號 1 位、指數 8 位（bias 127）、小數 23 位，值 $(-1)^s\times1.f\times2^{e-127}$。
- 指數全 0：f = 0 是 ±0；f ≠ 0 是非正規數 $0.f\times2^{-126}$。
- 指數全 1：f = 0 是 ±∞；f ≠ 0 是 NaN。

=== rc:co-arith:5
運算時在最低位後面多留 guard、round 兩位；sticky 是「後面任何一位是 1」就設成 1。用來正確捨入。
Round to nearest even：剛好在正中間時，捨入到最低位是 0（偶數）的那一個，避免永遠往上進位造成偏差。

=== rc:co-datapath:1
- R：op(6) rs(5) rt(5) rd(5) shamt(5) funct(6)
- I：op(6) rs(5) rt(5) imm(16)
- J：op(6) addr(26)

beq 目標 = PC+4 + (imm 符號延伸後 × 4)，可以跳 ±$2^{15}$ 道指令（約 ±128 KB）。
j 目標 = (PC+4 的最高 4 位) 接 addr 接 00，只能跳到同一個 256 MB 區塊內。

=== rc:co-datapath:2
| | RegDst | ALUSrc | MemtoReg | RegWrite | MemRead | MemWrite | Branch | ALUOp |
|---|---|---|---|---|---|---|---|---|
| R 型 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 10 |
| lw | 0 | 1 | 1 | 1 | 1 | 0 | 0 | 00 |
| sw | X | 1 | X | 0 | 0 | 1 | 0 | 00 |
| beq | X | 0 | X | 0 | 0 | 0 | 1 | 01 |

=== rc:co-datapath:3
lw 走過最多單元：取指令 → 讀暫存器 → ALU 算位址 → 讀記憶體 → 寫回暫存器，是最長的路。單週期每道指令都用同一個時脈，只能配合最慢的那道。

=== rc:co-datapath:4
找「需要這個訊號是 1」的指令：
- RegWrite 卡 0：R 型、lw 都寫不回去。
- MemtoReg 卡 0：lw 寫回的是位址，不是讀到的資料。
- ALUSrc 卡 0：lw、sw 拿錯第二個運算元（用 rt 而不是位移量）。
- Branch 卡 0：beq 永遠不跳。
- RegDst 卡 0：R 型寫到 rt 而不是 rd。

=== rc:co-datapath:5
lw 5、sw 4、R 型 4、beq 3、j 3。

=== rc:co-pipeline:1
理想加速比 = 級數 k（每級時間一樣、沒有危障）。n 道指令在 k 級管線要 $k+(n-1)$ 個週期。

=== rc:co-pipeline:2
結構危障（搶同一個硬體）、資料危障（要用還沒算好的值）、控制危障（分支還沒決定）。
5 級順序管線所有指令都在 ID 讀、在 WB 寫，而且照順序：後面的不可能比前面的先寫（沒有 WAW），也不可能在前面的讀之前寫（沒有 WAR）。

=== rc:co-pipeline:3
- EX hazard：EX/MEM.RegWrite、EX/MEM.Rd ≠ 0、EX/MEM.Rd = ID/EX.Rs（或 Rt）→ 從 EX/MEM 轉送。
- MEM hazard：MEM/WB.RegWrite、MEM/WB.Rd ≠ 0、MEM/WB.Rd = ID/EX.Rs（或 Rt），**而且不符合 EX hazard** → 從 MEM/WB 轉送。

排除的原因：連續好幾道都寫同一個暫存器時，要拿最新的那一個（在 EX/MEM）。

=== rc:co-pipeline:4
ID/EX.MemRead 為真，而且 ID/EX.Rt = IF/ID.Rs 或 ID/EX.Rt = IF/ID.Rt → 停一個週期。

=== rc:co-pipeline:5
分支在 ID 比較：
- 緊接在 ALU 指令後面、用到它的結果：停 1 個。
- 緊接在 lw 後面、用到它的結果：停 2 個。
- 用到的是前兩道 ALU 指令的結果：可以轉送，不用停。

=== rc:co-pipeline:6
一個迴圈跑完（最後一次不跳），重複執行很多輪：
- 1-bit：每輪錯 2 次（最後一次猜跳，下一輪第一次猜不跳）。
- 2-bit：每輪只錯 1 次（最後一次）。

=== rc:co-ilp:1
- 真相依 RAW：後面的指令要讀前面寫的結果。
- 反相依 WAR：後面的指令要寫前面還要讀的暫存器。
- 輸出相依 WAW：兩道指令寫同一個暫存器，順序不能亂。

=== rc:co-ilp:2
1. Issue：檢查結構危障和 WAW，有就不發。
2. Read operands：等 RAW 解除才讀。
3. Execute：執行。
4. Write result：檢查 WAR，前面還沒讀這個暫存器的指令讀完才寫。

=== rc:co-ilp:3
用保留站做暫存器重新命名：發射時，拿得到的運算元值直接抄進保留站，拿不到的記下「誰會產生它」的標籤 → WAR、WAW 消失。
RAW：在保留站等，CDB 廣播那個標籤的結果時抓下來。

=== rc:co-ilp:4
指令照順序進 ROB；執行完的結果先放在 ROB，只有排到隊頭時才寫回暫存器或記憶體（commit）。發生例外時，前面的都已經 commit、後面的都還沒改到狀態，把後面的清掉就好。

=== rc:co-ilp:5
- VLIW：編譯器把可以平行的指令包成一個長指令，硬體不檢查相依。
- 靜態超純量：硬體每個週期發好幾道，但照順序發，排程靠編譯器。
- 動態超純量：硬體亂序發射、動態排程（Tomasulo + ROB）。

=== rc:co-ilp:6
- Fine-grained：每個週期換一個執行緒，能藏住短停頓，但單一執行緒變慢。
- Coarse-grained：遇到長停頓（例如 cache miss）才換，換的代價高，藏不住短停頓。
- SMT：同一個週期從好幾個執行緒發指令，把多發射處理器的空位填滿。

=== rc:co-cache:1
- offset = lg（區塊大小，以 byte 算）
- index = lg（set 數）= lg（cache 大小 ÷（區塊大小 × 關聯度））
- tag = 位址長度 − index − offset

總位元數 = 區塊數 ×（資料位元 + tag + valid 位（+ dirty 位））。

=== rc:co-cache:2
- 命中時：write-through（同時寫記憶體）或 write-back（只寫 cache，被踢掉才寫回，需要 dirty 位）。
- 沒命中時：write-allocate（先搬進 cache 再寫）或 no-write-allocate（直接寫記憶體）。

常見組合：write-back + write-allocate、write-through + no-write-allocate。

=== rc:co-cache:3
- Compulsory：第一次用，一定沒有。
- Capacity：cache 裝不下。
- Conflict：剛好撞到同一個 set。

加大 cache → 降 capacity；提高關聯度 → 降 conflict；加大區塊 → 降 compulsory（太大時 conflict、capacity 反而上升，miss penalty 也變大）。

=== rc:co-cache:4
- AMAT = 命中時間 + miss rate × miss penalty。
- CPI = 基本 CPI + 每道指令的記憶體存取次數 × miss rate × miss penalty（指令和資料分開算）。
- 兩層：L1 的 miss penalty = L2 命中時間 + L2 local miss rate × L2 miss penalty。
- local miss rate = 這層的 miss ÷ 進到這層的存取；global miss rate = 這層的 miss ÷ CPU 的所有存取（= 各層 local 相乘）。

=== rc:co-cache:5
大小 N 的直接映射 cache，miss rate 約等於大小 N/2 的 2 路關聯 cache。
精確 LRU：k 路要記 k! 種先後順序，至少 $\lceil\lg(k!)\rceil$ 位元（2 路 1 位、4 路 5 位）。

=== rc:co-cache:6
假設送位址 1 週期、DRAM 存取 15 週期、傳一個 word 1 週期，區塊 4 個 word：
- 一個 word 寬：4 × (1 + 15 + 1) = 68。
- 四個 word 寬：1 + 15 + 1 = 17。
- 4 個 bank 交錯：1 + 15 + 4 × 1 = 20。

=== rc:co-vm-coherence:1
不可能的組合：
- TLB 命中、頁表沒命中（TLB 只放在記憶體裡的頁）。
- 頁表沒命中（頁不在記憶體）、cache 卻命中（資料不可能在 cache 裡）。

=== rc:co-vm-coherence:2
- VIVT：不用翻譯直接查，最快；但有別名問題（同一個實體位址對應多個虛擬位址），切換行程要清 cache。
- PIPT：沒有別名，但要先查 TLB 才能查 cache，比較慢。
- VIPT：用虛擬位址的 index 查 cache、同時查 TLB，tag 用實體位址比對。避免別名的條件：index + offset 全部落在頁內偏移裡 → 每一路的大小 ≤ 頁大小（cache ≤ 頁大小 × 關聯度）。

=== rc:co-vm-coherence:3
- MSI：I 讀 → S；I 或 S 要寫 → 發 invalidate，變 M；M 被別人讀 → 寫回、變 S；被別人寫 → I。
- MESI 多了 E：讀的時候沒有別人有這份 → E。E 要寫時直接變 M，不用發 invalidate，省一次匯流排交易。

=== rc:co-vm-coherence:4
- Snooping：每個 cache 都監聽共用匯流排，靠廣播。簡單，但核心一多匯流排就撐不住。
- Directory：用目錄記錄每個區塊在誰手上，點對點發訊息。能擴展到很多核心，代價是多一次查目錄的延遲和目錄的空間。

=== rc:co-vm-coherence:5
兩個核心改的是不同的變數，但它們剛好在同一個 cache 區塊裡，區塊就在兩個 cache 之間不斷被作廢、搬來搬去，像真的共享一樣慢。解法：把變數分到不同區塊（padding）。

=== rc:co-vm-coherence:6
循序一致性：所有處理器看到的記憶體操作，好像排成某一個交錯順序，而且每個處理器自己的操作照程式順序。
TSO：允許「先寫、後讀（不同位址）」時讀先完成，也就是 W→R 可以重排（寫入先放進 store buffer）。
