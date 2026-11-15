計算機結構以 Patterson & Hennessy《Computer Organization and Design》（COD）與 Hennessy & Patterson《Computer Architecture: A Quantitative Approach》（CA:AQA）為主。台大偏重**定量計算**（CPI、加速比、AMAT、管線時脈數、cache 位元數）與**機制的因果**（為什麼 forwarding 解不了 load-use、Tomasulo 怎麼消掉 WAR／WAW、VIPT 為什麼有大小限制）。每一個公式都要知道它的假設。

=== co-perf
title: 效能、功耗與 Amdahl 定律
est: 100
recall:
- CPU time 的三因子公式；三個因子各受什麼影響（演算法、語言、編譯器、ISA、組織、技術）？
- 為什麼 MIPS 會誤導？舉例。
- SPEC 為什麼用幾何平均？
- Amdahl 與 Gustafson 定律各自的假設。
- 動態功耗公式；為什麼降電壓比降頻率有效？
feynman: 推導 Amdahl 定律，並解釋為什麼即使把可加速部分加速到無限快，整體加速比仍有上限。推理鏈要從「新執行時間 = 不受影響部分 + 受影響部分/加速倍數」開始，寫出加速比，取極限得上限；再說明 Gustafson 定律為什麼會得出不同的結論（它改變了哪個假設）。
rubric:
- $T_{new}=T_{old}\left[(1-f)+\frac fs\right]$，f 為可加速部分占原時間的比例
- 加速比 $S=\frac{1}{(1-f)+f/s}$
- $s\to\infty$ 時 $S\to\frac1{1-f}$：不可加速的部分成為瓶頸
- 例：$f=0.9$ 上限 10 倍；用 1000 核也不到 10
- Gustafson 假設問題規模隨處理器數增加（固定時間而非固定工作量），可平行部分變大，加速比 $\approx N-(N-1)(1-f')$ 近似線性
---
## 1. 鐵律

$$\text{CPU time}=\text{IC}\times\text{CPI}\times T_{clk}=\frac{\text{IC}\times\text{CPI}}{f}$$

| 因子 | 受影響於 |
|---|---|
| IC（指令數） | 演算法、語言、編譯器、ISA |
| CPI | 演算法、編譯器、ISA、**組織**（管線、cache） |
| 時脈 | 組織、**製程技術** |

平均 CPI $=\sum_i \text{CPI}_i\times\frac{\text{IC}_i}{\text{IC}}$。

> [!陷阱] MIPS 與 MFLOPS
> $\text{MIPS}=\frac{f}{\text{CPI}\times10^6}$。它不考慮 IC：一台 ISA 較簡單的機器 MIPS 高，但可能要多很多指令才能完成同一件事。例：機器 A 用 10 億條 CPI=1 的指令，B 用 6 億條 CPI=1.5 的指令，同時脈下 A 的 MIPS 較高但 B 較快（$0.6\times1.5=0.9<1$）。

## 2. 平均與基準

- 比較執行時間：用時間的算術平均（或加權）。
- 比較速率（如 MIPS、throughput）：用**調和平均**。
- SPEC ratio＝參考機器時間／受測機器時間，用**幾何平均**：兩台機器的幾何平均比值與選哪台當參考機器無關。

## 3. Amdahl 與平行

$$S=\frac{1}{(1-f)+f/s},\qquad S_{\max}=\frac1{1-f}$$

- 平行化 $N$ 核：效率＝$S/N$。
- **強擴展**（問題大小固定）受 Amdahl 限制；**弱擴展**（每核工作量固定，問題隨核數變大）用 Gustafson：$S=N-(1-f)(N-1)$。
- 負載不平衡：最慢的那顆核決定完成時間。

> [!例題] 平行加速
> 100 個純量加法加上 $10\times10$ 矩陣加法（100 個可平行的加法），10 核與 100 核的加速比？若矩陣變成 $100\times100$？
+++ 看解答
原時間 200 單位。10 核：$100+100/10=110$，加速 1.82；100 核：$100+1=101$，加速 1.98。矩陣 $100\times100$：原時間 10100，10 核 $100+1000=1100$，加速 9.18；100 核 $100+100=200$，加速 50.5。問題變大，平行化才划算（弱擴展）。
+++

## 4. 功耗與成本

- 動態功耗 $P=\alpha\,C\,V^2 f$；動態能量 $\propto C V^2$。降電壓的效果是平方。
- 電壓降不下去（漏電）→ **power wall**，單核時脈停止成長、轉向多核；無法同時供電給所有電晶體 → dark silicon。
- 靜態功耗來自漏電，電晶體越多越大。
- 晶粒成本＝晶圓成本／（每片晶粒數 × 良率）；COD 的良率模型 $\text{yield}=1/(1+\text{缺陷密度}\times\text{面積}/2)^2$，面積變大成本急速上升。

> [!陷阱] 多選題常見敘述
> - 「時脈較高的處理器一定較快」✗。
> - 「CPI 越低越好，所以 RISC 一定比 CISC 快」✗，要看 IC。
> - 「用算術平均比較 SPEC ratio 也可以得到一致的排名」✗。
> - 「把 50% 的程式加速 10 倍，整體加速 5 倍」✗：$1/(0.5+0.05)=1.82$。

=== co-arith
title: 數字表示、加法器、Booth 乘法與 IEEE 754
est: 150
recall:
- n 位元二補數的範圍；如何判斷有號加法溢位？無號呢？
- Carry-lookahead 中 g、p 的定義與 $c_{i+1}$ 的展開。
- Booth 演算法看哪兩個位元、各做什麼？Radix-4 修正 Booth 的好處？
- IEEE 754 單精度各欄位、bias、denormal 與特殊值。
- Guard、round、sticky 位元的用途；什麼是 round to nearest even？
feynman: 解釋 Booth 乘法為什麼正確。推理鏈要從二補數的值 $-q_{n-1}2^{n-1}+\sum q_i2^i$ 出發，證明它等於 $\sum_{i=0}^{n-1}(q_{i-1}-q_i)2^i$（$q_{-1}=0$），再說明演算法每一步「看 $(q_i,q_{i-1})$ 決定加 M、減 M 或不動，然後算術右移」正好就是在逐項累加這個和；最後說明為什麼一串連續的 1 只需要一次減法和一次加法。
rubric:
- 二補數值 $Q=-q_{n-1}2^{n-1}+\sum_{i=0}^{n-2}q_i2^i$
- 展開 $\sum_{i=0}^{n-1}(q_{i-1}-q_i)2^i$，相鄰項望遠鏡相消後等於 Q（$q_{-1}=0$）
- $(q_i,q_{i-1})=(1,0)$ 對應係數 −1（減 M），$(0,1)$ 對應 +1（加 M），相同則 0
- 每步後算術右移，等同把第 i 項乘上 $2^i$ 對齊；所以乘積 $M\times Q=\sum(q_{i-1}-q_i)M2^i$
- 一串 1 從第 i 位到第 j 位等於 $2^{j+1}-2^i$：開頭減一次、結尾加一次
---
## 1. 整數表示

| 表示法 | 範圍（n 位元） | 零 | 備註 |
|---|---|---|---|
| 無號 | $0\sim2^n-1$ | 1 個 | |
| 符號大小 | $-(2^{n-1}-1)\sim2^{n-1}-1$ | $\pm0$ | |
| 一補數 | 同上 | $\pm0$ | 加法要 end-around carry |
| **二補數** | $-2^{n-1}\sim2^{n-1}-1$ | 1 個 | 最高位權重 $-2^{n-1}$ |
| 偏移（bias） | $-b\sim2^n-1-b$ | | IEEE 指數用 |

- 取負：反轉所有位元再加 1。$-2^{n-1}$ 取負還是自己（溢位）。
- 符號延伸：把最高位複製到新增的高位。

> [!考點] 溢位判斷
> - 有號加法：兩運算元同號而結果異號；等價於「進入最高位的進位 $\ne$ 最高位送出的進位」。異號相加永遠不會溢位。
> - 無號加法：最高位有進位出來。無號減法：有借位。
> - MIPS 的 `add` 溢位會產生例外，`addu` 不會；C 語言不檢查。

## 2. 加法器

- **Ripple carry**：每位等前一位的進位，延遲 $O(n)$（約 $2n$ 個閘延遲）。
- **Carry lookahead**：$g_i=a_ib_i$（產生）、$p_i=a_i+b_i$（傳遞），
$$c_{i+1}=g_i+p_ic_i,\quad c_2=g_1+p_1g_0+p_1p_0c_0,\ \dots$$
4 位元一組時群組 $G=g_3+p_3g_2+p_3p_2g_1+p_3p_2p_1g_0$、$P=p_3p_2p_1p_0$，再用第二層 lookahead，延遲 $O(\lg n)$。
- **Carry-select**：高位同時算 $c=0$ 與 $c=1$ 兩種結果再選。
- **Carry-save**：多個運算元相加時先不傳遞進位（乘法器的 Wallace tree 用）。

## 3. 乘法與除法

**Booth（radix-2）**：檢查 $(q_0,q_{-1})$：`10` → $A\leftarrow A-M$；`01` → $A\leftarrow A+M$；`00`／`11` 不動；然後 $(A,Q,q_{-1})$ 整體**算術**右移一位，重複 $n$ 次。

> [!例題] 用 Booth 算 $2\times(-3)$（4 位元）
+++ 看解答
$M=0010$，$-M=1110$，$Q=1101$，$q_{-1}=0$，$A=0000$。
1. $(1,0)$：$A=0000+1110=1110$；右移 → $A=1111,Q=0110,q_{-1}=1$。
2. $(0,1)$：$A=1111+0010=0001$；右移 → $A=0000,Q=1011,q_{-1}=0$。
3. $(1,0)$：$A=0000+1110=1110$；右移 → $A=1111,Q=0101,q_{-1}=1$。
4. $(1,1)$：不動；右移 → $A=1111,Q=1010$。
結果 $AQ=11111010=-6$。
+++

**修正 Booth（radix-4）**：一次看 3 位元 $(q_{2i+1},q_{2i},q_{2i-1})$，對應 $\{0,+1,+1,+2,-2,-1,-1,0\}\times M$，部分積數減半。

**除法**：restoring（減完若為負再加回來）與 non-restoring（不加回，下一步改成加）。C 語言中餘數與**被除數同號**：$-7/2=-3$ 餘 $-1$。

## 4. IEEE 754

| | 符號 | 指數 | 小數 | bias |
|---|---|---|---|---|
| 單精度 | 1 | 8 | 23 | 127 |
| 倍精度 | 1 | 11 | 52 | 1023 |

值 $=(-1)^s\times1.f\times2^{e-\text{bias}}$。

| 指數欄位 | 小數 = 0 | 小數 ≠ 0 |
|---|---|---|
| 全 0 | $\pm0$ | **非正規數** $(-1)^s\times0.f\times2^{1-\text{bias}}$ |
| 全 1 | $\pm\infty$ | NaN |

單精度：最小正規數 $2^{-126}\approx1.18\times10^{-38}$、最大 $(2-2^{-23})\times2^{127}\approx3.4\times10^{38}$、最小非正規數 $2^{-149}$；約 7 位十進位有效數字。

> [!例題] $-0.75$ 的單精度表示
+++ 看解答
$0.75=1.1_2\times2^{-1}$，指數欄位 $-1+127=126=01111110$，小數 $1000\cdots0$。位元 `1 01111110 100…0` → `0xBF400000`。
+++

- **捨入**：保留 guard、round 兩個額外位元與 sticky 位元（後面還有沒有 1），預設 round to nearest, ties to even。
- 浮點加法**不滿足結合律**：$x=-1.5\times10^{38},y=1.5\times10^{38},z=1$：$(x+y)+z=1$，$x+(y+z)=0$。
- 0.1 無法精確表示（二進位無限循環）。

> [!陷阱] 多選題常見敘述
> - 「二補數的正負範圍對稱」✗。
> - 「IEEE 754 中指數欄位用二補數」✗，用偏移。
> - 「非正規數讓精度保持不變」✗：它犧牲有效位數，換來逐漸下溢（gradual underflow）。
> - 「NaN == NaN 為真」✗。
> - 「兩個正數相加，若最高位有進位就是有號溢位」✗（那是無號溢位的判準）。

=== co-datapath
title: 指令集與單週期／多週期資料路徑
est: 130
recall:
- MIPS 的 R、I、J 格式各欄位；beq 與 j 的目標位址怎麼算？可跳多遠？
- RISC-V 的 R、I、S 格式各欄位怎麼排？跟 MIPS 差在哪（opcode 位置、分支怎麼算、有沒有延遲槽、呼叫慣例）？
- 單週期資料路徑中 R 型、lw、sw、beq 的控制訊號。
- 為什麼單週期的時脈由 lw 決定？
- 某個控制訊號卡在 0（stuck-at-0）時，哪些指令會出錯？
- 多週期實作中各類指令要幾個週期？
feynman: 帶著一條 lw `$t0`, 8(`$s1`) 走一遍單週期資料路徑：依序說出它經過哪些元件、每個元件做什麼、控制訊號 RegDst、ALUSrc、MemtoReg、RegWrite、MemRead、MemWrite、Branch 各設成多少以及為什麼。最後用 COD 的延遲數字（記憶體 200 ps、暫存器檔 100 ps、ALU 200 ps）說明為什麼它決定了整個處理器的時脈週期。
rubric:
- 取指令（指令記憶體）→ 讀暫存器 `$s1`（rs）→ ALU 算 `$s1` + 符號延伸(8) → 資料記憶體讀取 → 寫回 `$t0`（rt）
- RegDst=0（目的暫存器是 rt）、ALUSrc=1（第二運算元是立即值）
- MemtoReg=1（寫回資料來自記憶體）、RegWrite=1、MemRead=1、MemWrite=0、Branch=0
- 它用到五個階段：200+100+200+200+100 = 800 ps，是所有指令中最長的路徑
- 單週期中每條指令都用同一個時脈，所以時脈 ≥ 800 ps，其他較短的指令也被拖慢
---
## 1. ISA 設計

- RISC：固定長度指令、load/store 架構、暫存器多、定址模式少；CISC（x86）：變長指令、記憶體運算元。現代 x86 在內部把指令拆成 micro-ops。
- 四個設計原則：簡單有利於規律、越小越快、好設計需要好的折衷、讓常見情況變快。

| 格式 | 欄位（位元數） |
|---|---|
| R | op(6) rs(5) rt(5) rd(5) shamt(5) funct(6) |
| I | op(6) rs(5) rt(5) immediate(16) |
| J | op(6) address(26) |

> [!考點] 目標位址
> - `beq`：$PC+4+\text{SignExt}(imm)\times4$，可達 $PC+4$ 前後約 $\pm2^{17}$ bytes（$\pm2^{15}$ 個指令）。
> - `j`：$\{(PC+4)[31:28],\ address,\ 00\}$，只能跳到同一個 256 MB 區塊內。
> - RISC-V：分支 $PC+\text{imm}$（imm 以 2 bytes 為單位）、`jal` 有 20 位元立即值。
> - 定址模式：立即、暫存器、base＋displacement、PC 相對、pseudo-direct。

> [!考點] MIPS ↔ RISC-V 對照
> - 暫存器：MIPS `$0`～`$31`（`$zero`）；RISC-V `x0`～`x31`，`x0` 恆為 0。ABI 名：`ra`=x1、`sp`=x2、`a0`～`a7` 參數／回傳、`t0`～`t6` 呼叫者保存、`s0`～`s11` 被呼叫者保存。
> - 格式：MIPS R/I/J，op 在最高 6 位元；RISC-V R/I/S/B/U/J，opcode 在最低 7 位元，再加 funct3、funct7。
> - 欄位順序（高→低）：R `funct7|rs2|rs1|funct3|rd|opcode`；I `imm[11:0]|rs1|funct3|rd|opcode`；S `imm[11:5]|rs2|rs1|funct3|imm[4:0]|opcode`（立即值拆開，讓 rs1、rs2 位置固定）。
> - 分支：MIPS $PC+4+imm\times4$、有延遲槽；RISC-V $PC+imm$（imm 以 2 bytes 為單位，B 型 ±4 KB）、**沒有延遲槽**。
> - 呼叫：MIPS `jal`／`jr $ra`；RISC-V `jal ra, f`／`jalr x0, 0(ra)`（即 `ret`）。
> - 載入常數：MIPS `lui`＋`ori`；RISC-V `lui`＋`addi`，`addi` 的立即值會符號延伸，低 12 位元 ≥ `0x800` 時 `lui` 要多加 1。
> - RV64：`ld`／`sd` 存取 8 bytes，`lw`／`sw` 存取 4 bytes。

> [!陷阱] RISC-V 常見敘述
> - 「RISC-V 的 opcode 在指令的最高位元」✗（在最低 7 位元）。
> - 「RISC-V 的 beq 目標是 PC+4 加位移」✗（從分支自己的 PC 算）。
> - 「RISC-V 有分支延遲槽」✗（沒有）。
> - 「RISC-V 的 sw 立即值被拆成兩段」✓（imm[11:5] 和 imm[4:0]）。
> - 「寫入 x0 的結果會被丟掉」✓（x0 恆為 0）。

## 2. 單週期資料路徑

| 指令 | RegDst | ALUSrc | MemtoReg | RegWrite | MemRead | MemWrite | Branch | ALUOp |
|---|---|---|---|---|---|---|---|---|
| R 型 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 10 |
| lw | 0 | 1 | 1 | 1 | 1 | 0 | 0 | 00 |
| sw | X | 1 | X | 0 | 0 | 1 | 0 | 00 |
| beq | X | 0 | X | 0 | 0 | 0 | 1 | 01 |

ALUOp：00 → 加（算位址）、01 → 減（比較）、10 → 看 funct。PCSrc＝Branch AND Zero。

> [!例題] 卡住的控制訊號
> 若 RegDst 卡在 0，哪些指令壞掉？若 MemtoReg 卡在 1 呢？
+++ 看解答
RegDst=0 會把結果寫到 rt：R 型指令（目的是 rd）壞掉；lw 正常；sw、beq 不寫暫存器，不受影響。MemtoReg=1 時寫回值都來自記憶體：R 型壞掉（寫回的是記憶體讀出的雜值），lw 正常。
+++

**時脈**：COD 的元件延遲（指令記憶體 200、讀暫存器 100、ALU 200、資料記憶體 200、寫暫存器 100 ps）：R 型 600、lw 800、sw 700、beq 500、j 200。單週期時脈 800 ps；用 5 級管線約 200 ps。

## 3. 多週期

把指令分成 IF、ID／讀暫存器、EX、MEM、WB，每步一個週期，元件可以重複使用（一個記憶體、一個 ALU 即可）。

| 指令 | 週期數 |
|---|---|
| lw | 5 |
| R 型、sw | 4 |
| beq、j | 3 |

控制用有限狀態機（或微程式）。平均 CPI 依指令組成計算，例如 lw 25%、sw 10%、R 52%、beq 11%、j 2%：$0.25\times5+0.10\times4+0.52\times4+0.11\times3+0.02\times3=4.12$。

> [!陷阱] 多選題常見敘述
> - 「單週期處理器的 CPI 是 1，所以最快」✗：時脈被最長指令拖慢。
> - 「單週期資料路徑可以只用一個記憶體」✗：同一週期要取指令又要存取資料，需要分開的指令與資料記憶體。
> - 「多週期實作的每條指令週期數都一樣」✗。
> - 「beq 的位移量以 byte 為單位」✗（MIPS 以 word 為單位，所以要乘 4）。

=== co-pipeline
title: 管線與危障
est: 170
labs: pipe
recall:
- 理想管線加速比；n 條指令在 k 級管線需要幾個週期？
- 三種危障；5 級順序管線為什麼不會有 WAR、WAW？
- Forwarding 單元判斷 EX hazard 與 MEM hazard 的條件；為什麼 MEM hazard 要排除 EX hazard？
- Load-use 偵測條件。
- 分支在 ID 決定時，ALU 指令與 lw 後接分支各要 stall 幾個？
- 1-bit 與 2-bit 分支預測在迴圈上的錯誤次數。
feynman: 解釋為什麼在標準 5 級管線加上 forwarding 之後，「lw 後面緊接著使用該暫存器的指令」仍然需要 stall 一個週期，而「add 後面緊接著使用結果的指令」不需要。推理鏈要說清楚資料在哪個週期結束時才產生、下一條指令在哪個週期開始時就需要它、forwarding 只能把資料往「同一時刻或之後」送，以及硬體如何偵測並插入 bubble。
rubric:
- add 的結果在 EX 結束（第 3 週期末）產生，下一條指令在第 4 週期的 EX 開頭需要，可從 EX/MEM 轉送
- lw 的資料在 MEM 結束（第 4 週期末）才產生，下一條指令卻在第 4 週期的 EX 開頭就需要
- forwarding 不能把資料送回過去，所以必須延後一週期，之後從 MEM/WB 轉送
- 偵測：ID/EX.MemRead 且 ID/EX.Rt 等於 IF/ID 的 Rs 或 Rt
- 處理：控制訊號清為 0（插入 bubble），PC 與 IF/ID 不更新
---
## 1. 基本

- $k$ 級、$n$ 條指令：$k+n-1$ 個週期。理想加速比趨近 $k$（各級時間平均、$n$ 很大）；實際受限於最慢的一級、管線暫存器延遲與危障。
- 管線提高 **throughput**，不縮短單一指令的延遲（反而略增）。

| 危障 | 原因 | 解法 |
|---|---|---|
| 結構 | 硬體資源衝突（例如只有一個記憶體） | 分開 I／D cache、增加資源 |
| 資料 | 指令需要前面指令還沒寫回的結果 | forwarding、stall、指令排程 |
| 控制 | 分支結果未知 | stall、預測、延遲分支、提早決定 |

5 級**順序**管線中所有寫回都在 WB、讀都在 ID，所以只有 RAW；WAR、WAW 要等到亂序執行或多週期運算單元才會出現。

## 2. Forwarding 與 load-use

COD 的 forwarding 條件（ForwardA 為例，ForwardB 把 Rs 換成 Rt）：
- **EX hazard**：`EX/MEM.RegWrite` 且 `EX/MEM.Rd ≠ 0` 且 `EX/MEM.Rd = ID/EX.Rs` → 從 EX/MEM 轉送。
- **MEM hazard**：`MEM/WB.RegWrite` 且 `MEM/WB.Rd ≠ 0` 且**不是**上面的 EX hazard 且 `MEM/WB.Rd = ID/EX.Rs` → 從 MEM/WB 轉送。排除 EX hazard 是為了在連續寫同一個暫存器時拿**最新**的值。
- **Load-use 偵測**（在 ID）：`ID/EX.MemRead` 且（`ID/EX.Rt = IF/ID.Rs` 或 `ID/EX.Rt = IF/ID.Rt`）→ stall 一週期。

| 相依距離 | 無 forwarding（前半寫、後半讀） | 有 forwarding |
|---|---|---|
| ALU → 緊接下一條 | 2 stall | 0 |
| ALU → 隔一條 | 1 stall | 0 |
| lw → 緊接下一條 | 2 stall | **1 stall** |
| lw → 隔一條 | 1 stall | 0 |

@lab pipe

> [!例題] 用排程消除 stall
> `a = b + e; c = b + f;` 編成 `lw b; lw e; add a; sw a; lw f; add c; sw c`，有兩個 load-use stall。把 `lw f` 往前搬到 `add a` 之前，就變成 0 個 stall（13 → 11 週期）。

## 3. 控制危障

- **假設不跳**：跳了就 flush 已取的指令。
- **分支提早到 ID 決定**：多一個比較器與目標加法器，懲罰只剩 1 週期；但分支要用的暫存器若由前一條 ALU 指令產生，要 stall 1；由前一條 lw 產生，要 stall 2。
- **延遲分支**：分支後面的 delay slot 一定執行，由編譯器從分支前、目標處或不跳的路徑挑指令填。
- **動態預測**：
  - 1-bit：迴圈跑 $n$ 次，每次進入迴圈會錯 2 次（最後一次離開與下次第一次）。
  - 2-bit 飽和計數器：連錯兩次才改變預測，迴圈只錯 1 次。
  - BTB 存目標位址；correlating（全域歷史）與 tournament 預測器。

$$\text{CPI}=1+\text{分支比例}\times\text{預測錯誤率}\times\text{懲罰}+\text{load-use 比例}\times1+\cdots$$

## 4. 例外

精確例外：例外指令之前的都完成、之後的都沒影響狀態。發生時 flush 之後的指令，把 PC 存入 EPC、原因存入 Cause，跳到處理程式。同一週期多個例外時，處理**最早**那條指令的。

> [!陷阱] 多選題常見敘述
> - 「管線可以減少單一指令的執行時間」✗。
> - 「有了 forwarding 就不需要 stall」✗（load-use）。
> - 「5 級 MIPS 管線會發生 WAW」✗。
> - 「2-bit 預測器在任何迴圈上都比 1-bit 好」通常 ✓，但存在交替跳／不跳的序列讓 2-bit 每次都錯。
> - 「增加管線級數一定提高效能」✗：分支懲罰變大、管線暫存器負擔、功耗。

=== co-ilp
title: 指令階層平行：Tomasulo、ROB 與多發射
est: 160
recall:
- 真相依、反相依（WAR）、輸出相依（WAW）的定義。
- Scoreboard 的四個階段，各在哪裡檢查哪種危障？
- Tomasulo 用什麼消除 WAR、WAW？RAW 怎麼處理？
- ROB 為什麼能提供精確例外？
- VLIW、靜態超純量、動態超純量的差別。
- 三種多執行緒：fine-grained、coarse-grained、SMT。
feynman: 用 H&P 的例子 DIV.D F0,F2,F4 / ADD.D F6,F0,F8 / S.D F6,0(R1) / SUB.D F8,F10,F14 / MUL.D F6,F10,F8 解釋 Tomasulo 如何消除 WAR 和 WAW。推理鏈要先找出所有相依（哪兩條、哪個暫存器、哪一種），然後說明 issue 時運算元「值或標籤」被複製進保留站、暫存器狀態表只記最後一個寫入者，這兩件事分別如何讓 SUB.D 可以提早寫 F8、讓 F6 最後的值是 MUL.D 的結果。
rubric:
- RAW：ADD 用 DIV 的 F0；S.D 用 ADD 的 F6；MUL 用 SUB 的 F8
- WAR：ADD 讀 F8、SUB 寫 F8；S.D 讀 F6、MUL 寫 F6。WAW：ADD 與 MUL 都寫 F6
- issue 時 ADD 已把 F8 的值讀進保留站的 Vk，SUB 之後改 F8 不影響它 → WAR 消除
- 暫存器狀態表 F6 先指向 ADD 的保留站、MUL issue 後改指向 MUL；ADD 完成時廣播的標籤不再對應 F6，不會寫入 → WAW 消除
- RAW 靠等待 CDB 上對應標籤的結果（S.D 等的是 ADD 的標籤，不是 F6 這個名字）
---
## 1. 相依

- **真相依**（RAW）：$j$ 用到 $i$ 的結果。
- **反相依**（WAR）：$j$ 寫 $i$ 要讀的暫存器。**輸出相依**（WAW）：兩者寫同一個暫存器。後兩者是**名稱相依**，換名字（register renaming）就消失。
- 控制相依：指令是否執行取決於分支。

**Loop unrolling**：展開後排程、改用不同暫存器（編譯器換名），減少分支與 stall，代價是程式碼變大、暫存器壓力。

## 2. Scoreboard（CDC 6600）

| 階段 | 檢查 |
|---|---|
| Issue | 功能單元空閒（結構）且沒有其他指令要寫同一目的暫存器（**WAW** → stall） |
| Read operands | 運算元都可用（**RAW** → 等待） |
| Execute | — |
| Write result | 前面還沒讀運算元的指令不能有人要讀這個暫存器（**WAR** → 延後寫入） |

沒有換名，所以 WAR、WAW 只能用等待解決；也沒有 forwarding（結果寫進暫存器檔後才讀）。

## 3. Tomasulo

- **保留站**（reservation station）存運算元的值（Vj、Vk）或產生它的保留站標籤（Qj、Qk）。
- **暫存器狀態表**記錄每個暫存器最後由哪個保留站寫入。
- 結果透過 **CDB** 廣播，所有等這個標籤的保留站與暫存器同時接收（等同 forwarding）。
- 三個階段：issue（有空的保留站才 issue；讀值或標籤）、execute（運算元齊了才執行，處理 RAW）、write result（廣播）。
- 換名在 issue 時完成，WAR 與 WAW 被消除；分散式的危障偵測。
- 缺點：CDB 是瓶頸（一個週期一個結果）；沒有 ROB 時例外不精確。

## 4. 硬體推測與 ROB

在 Tomasulo 加上 **reorder buffer**：結果先寫進 ROB，**依程式順序 commit** 才寫入暫存器或記憶體。四個階段：issue、execute、write result、**commit**。分支預測錯誤或例外時，把 ROB 中後面的項目全部清掉即可，因此支援**推測執行**與**精確例外**。換名的標籤改用 ROB 編號。

## 5. 多發射與執行緒

| 方式 | 誰決定一起發射 | 例 |
|---|---|---|
| 靜態超純量 | 硬體，順序發射 | 早期 RISC |
| VLIW | 編譯器把多個運算包成一個長指令 | Itanium（EPIC）、DSP |
| 動態超純量 | 硬體，亂序＋推測 | 現代 x86、ARM 大核 |

| 多執行緒 | 切換時機 | 效果 |
|---|---|---|
| Fine-grained | 每個週期輪流 | 隱藏短 stall，單一執行緒變慢 |
| Coarse-grained | 遇到長 stall（L2 miss）才換 | 換的時候要清空管線 |
| SMT | 同一週期從多個執行緒發射 | 利用多發射處理器空著的發射槽 |

**Flynn 分類**：SISD、SIMD（向量、GPU 的 SIMT）、MISD（幾乎沒有）、MIMD（多核心）。

> [!陷阱] 多選題常見敘述
> - 「Tomasulo 演算法能保證精確例外」✗，要 ROB。
> - 「Scoreboard 用暫存器換名消除 WAR」✗。
> - 「VLIW 的硬體比超純量複雜」✗，複雜度移到編譯器。
> - 「SMT 需要多組暫存器檔與 PC」✓。
> - 「register renaming 能消除真相依」✗。

=== co-cache
title: Cache 設計與記憶體階層
est: 170
labs: cache
recall:
- 位址如何切成 tag、index、offset？cache 總位元數怎麼算？
- 寫入策略的兩個維度與常見組合。
- 3C 失誤；加大 cache、提高關聯度、加大區塊各影響哪一種？
- AMAT 與含 cache stall 的 CPI 公式；兩層 cache 的 local 與 global miss rate。
- 2:1 cache 經驗法則；精確 LRU 每個 set 要幾個位元？
- 四種記憶體組織（一 word 寬、四 word 寬、交錯）的 miss penalty。
feynman: 解釋 3C 失誤（compulsory、capacity、conflict）各自的定義與量測方式，並說明「加大區塊」為什麼一開始降低 miss rate、太大之後反而升高，以及它對 miss penalty 的影響。推理鏈要用空間區域性、區塊數變少造成的衝突與污染來說明，最後推論到 AMAT 為什麼呈 U 形。
rubric:
- Compulsory：第一次存取一定失誤（無限大 cache 也會發生）；capacity：全關聯同大小 cache 也放不下工作集；conflict：全關聯不會失誤、但因映射衝突而失誤
- 加大 cache 主要降 capacity；提高關聯度主要降 conflict；加大區塊主要降 compulsory（利用空間區域性）
- 區塊太大：固定容量下區塊數變少，conflict／capacity 失誤增加，也會載入用不到的資料（污染）
- 區塊越大 miss penalty 越大（要搬更多資料）
- AMAT = hit time + miss rate × miss penalty，兩者相乘使 AMAT 對區塊大小呈 U 形
---
## 1. 基本組織

位址 $m$ 位元、容量 $C$ bytes、區塊 $B$ bytes、$k$-way：set 數 $S=\frac{C}{Bk}$。
$$\text{offset}=\lg B,\quad\text{index}=\lg S,\quad\text{tag}=m-\text{index}-\text{offset}$$
總位元數＝區塊數 ×（資料 $8B$ ＋ tag ＋ valid ＋ dirty（write-back）＋ 替換位元）。

> [!例題] COD 經典
> 32 位元位址、直接映射、16 KB 資料、每塊 4 words（16 bytes），總共多少位元？
+++ 看解答
區塊數 $2^{10}$；offset 4 位元、index 10、tag $32-10-4=18$。每塊 $128+18+1=147$ 位元，總 $147\times1024=150528$ 位元 ≈ 147 Kbits，是資料量的 1.15 倍。
+++

@lab cache

- 直接映射：每個 set 一塊，比較器 1 個，hit time 最短。
- $k$-way：$k$ 個比較器加多工器；全關聯：每塊一個比較器。
- 替換：精確 LRU 每個 set 要 $\lceil\lg(k!)\rceil$ 位元（4-way 要 5 位元）；pseudo-LRU 用 $k-1$ 位元的樹；也可隨機。

## 2. 寫入策略

| | Write-through | Write-back |
|---|---|---|
| 做法 | 同時寫 cache 與下一層 | 只寫 cache，被換出時若 dirty 才寫回 |
| 優點 | 簡單，下一層永遠是最新 | 寫入頻寬需求低 |
| 搭配 | write buffer、no-write-allocate | **write-allocate** |

## 3. 3C 與設計參數

| 調整 | Compulsory | Capacity | Conflict | 代價 |
|---|---|---|---|---|
| 加大容量 | — | ↓ | ↓ | hit time ↑、成本、功耗 |
| 提高關聯度 | — | — | ↓ | hit time ↑ |
| 加大區塊 | ↓ | 太大時 ↑ | 太大時 ↑ | miss penalty ↑ |

**2:1 經驗法則**：大小 $N$ 的直接映射 cache，miss rate 約等於大小 $N/2$ 的 2-way cache。

## 4. 效能公式

$$\text{AMAT}=\text{hit time}+\text{miss rate}\times\text{miss penalty}$$
$$\text{CPI}=\text{CPI}_{base}+\frac{\text{記憶體存取}}{\text{指令}}\times\text{miss rate}\times\text{miss penalty}$$
指令 cache 每條指令存取 1 次；資料 cache 只有 load/store 比例那麼多次。

**兩層**：$\text{AMAT}=HT_1+MR_1(HT_2+MR_2^{local}\times MP_2)$。Global miss rate of L2 $=MR_1\times MR_2^{local}$。L1 追求 hit time，L2 追求 miss rate（較大、較高關聯度、較大區塊）。

> [!例題] 加 L2
> 基礎 CPI 1、4 GHz、主記憶體 100 ns，每條指令的主記憶體失誤率 2%。加上 5 ns 的 L2 使得到主記憶體的失誤率降為 0.5%，快多少？
+++ 看解答
miss penalty 400 週期：原 CPI $=1+0.02\times400=9$。L2 命中 20 週期：CPI $=1+0.02\times20+0.005\times400=3.4$，快 $9/3.4=2.6$ 倍。
+++

## 5. 主記憶體與 miss penalty

送位址 1 週期、DRAM 存取 15 週期、傳一個 word 1 週期，區塊 4 words：
- 一個 word 寬：$1+4\times15+4\times1=65$
- 四個 word 寬：$1+15+1=17$
- 四個 bank 交錯：$1+15+4\times1=20$

## 6. 進階最佳化（CA:AQA）

小而簡單的 L1、way prediction、pipelined cache、**non-blocking cache**（hit under miss）、multi-bank、**critical word first / early restart**、合併 write buffer、編譯器最佳化（**loop interchange**、**blocking**）、硬體與軟體 prefetch、victim cache。

> [!陷阱] 多選題常見敘述
> - 「提高關聯度一定降低 AMAT」✗（hit time 變長）。
> - 「區塊越大 miss rate 越低」✗。
> - 「write-through 必須搭配 write-allocate」✗，常見是 no-write-allocate。
> - 「全關聯 cache 沒有 capacity miss」✗，沒有的是 conflict miss。
> - 「L2 的 local miss rate 通常比 L1 低」✗，常常很高（容易的都被 L1 接走了）。

=== co-vm-coherence
title: TLB 與 cache 互動、cache 一致性與記憶體一致性
est: 140
recall:
- TLB、頁表、cache 三者命中／失誤的組合中，哪些不可能發生？
- VIVT、PIPT、VIPT 的優缺點；VIPT 避免別名的條件。
- MSI 與 MESI 的狀態轉換；E 狀態省了什麼？
- Snooping 與 directory 的差別。
- 什麼是 false sharing？
- 循序一致性；TSO 允許哪一種重排？
feynman: 用兩顆處理器 P1、P2 對同一個 cache 區塊做「P1 讀、P2 讀、P1 寫、P2 讀」，逐步說明 MESI 協定下兩邊的狀態變化與匯流排上發生的事。推理鏈要講出每一步的觸發事件（處理器讀寫、匯流排上看到的請求）、為什麼要 invalidate、寫回由誰負責；最後說明若兩個處理器寫的是同一區塊中不同的變數（false sharing），會造成什麼額外成本。
rubric:
- P1 讀：沒有其他副本 → P1 進入 E
- P2 讀：P1 看到匯流排讀請求，E → S；P2 取得資料為 S
- P1 寫：S 狀態寫入要先在匯流排送出 invalidate，P2 S → I，P1 → M（若 P1 原本是 E 則可不經匯流排直接變 M）
- P2 讀：P2 讀失誤，P1 看到請求，提供資料（並寫回記憶體），P1 M → S，P2 → S
- False sharing：不同變數在同一區塊，寫入仍會互相 invalidate，區塊在兩個 cache 間來回搬，產生大量一致性失誤
---
## 1. TLB、頁表與 cache

| TLB | 頁表 | Cache | 可能嗎？ |
|---|---|---|---|
| hit | hit | hit／miss | 可能（TLB 命中時其實不會去查頁表） |
| miss | hit | hit／miss | 可能 |
| miss | miss | miss | 可能：page fault |
| hit | miss | — | **不可能**：頁不在記憶體，TLB 不會有它的轉換 |
| miss | miss | hit | **不可能**：頁不在記憶體，資料不可能在 cache |

| 索引方式 | 優點 | 問題 |
|---|---|---|
| PIPT | 沒有別名問題 | 要先查 TLB，hit time 長 |
| VIVT | 不用先轉換 | **同義字**（兩個虛擬位址對到同一實體位址）、**同名字**（不同行程同一虛擬位址），context switch 要清 cache 或加 PID |
| VIPT | 用頁內位移當 index，與 TLB 平行查詢 | 要求 $\frac{\text{cache 大小}}{\text{關聯度}}\le$ 頁大小，否則 index 用到虛擬頁號的位元而產生別名 |

> [!例題] VIPT 限制
> 4 KB 頁、想做 32 KB 的 VIPT L1，至少要幾路關聯？
+++ 看解答
$32\text{ KB}/k\le4\text{ KB}$ ⇒ $k\ge8$。這就是為什麼很多 L1 是 32 KB、8-way。
+++

## 2. Cache 一致性

一致性要求：(1) 處理器讀到自己最後寫的值；(2) 其他處理器的寫入最終會被看見；(3) 對同一位址的寫入有全域一致的順序（write serialization）。

- **Snooping**：每個 cache 監聽共享匯流排，適合小規模。
- **Directory**：在記憶體端記錄每個區塊的狀態與擁有者（bit vector），點對點傳訊，可擴展到很多核。
- **Write-invalidate**（主流）vs write-update（廣播新值，頻寬大）。

| MESI 狀態 | 意義 |
|---|---|
| M（Modified） | 只有我有、已被修改（記憶體是舊的） |
| E（Exclusive） | 只有我有、與記憶體一致 → **寫入時不用發匯流排請求** |
| S（Shared） | 可能多人有、與記憶體一致 |
| I（Invalid） | 無效 |

- 讀失誤：別人都沒有 → E；別人有 → S（擁有 M 的那個要提供資料並寫回，自己變 S）。
- 寫入：S → 發 invalidate → M；E → 直接 M；I → read-for-ownership → M。
- MOESI 多一個 O（Owned）：可以把髒資料直接分享給別人而不寫回記憶體。

**False sharing**：兩個處理器寫同一區塊中不同的變數，區塊仍來回被 invalidate。解法：把變數 padding 到不同的區塊。

## 3. 記憶體一致性模型

- **循序一致性（SC）**：所有處理器的操作像是某種交錯，且各自保持程式順序。
- **TSO**（x86）：允許「store 之後的 load」先完成（store buffer），其他順序保持。

> [!例題] 經典 litmus test
> 初值 $x=y=0$。P1：`x=1; r1=y;`  P2：`y=1; r2=x;`。結果 $r1=r2=0$ 可能嗎？
+++ 看解答
SC 下不可能（不管怎麼交錯，至少有一個 store 在對方的 load 之前）。TSO 下可能：兩邊的 store 都還在 store buffer，load 先執行讀到 0。這也是 Peterson 演算法在 x86 上需要 `mfence` 的原因。
+++

## 4. 同步原語

- Atomic exchange、test-and-set、**LL/SC**（load-linked／store-conditional：中間若有人寫入該位址，SC 失敗）。
- Spin lock 用 **test-and-test-and-set**：先在自己的 cache 上讀到鎖是空的才做原子操作，減少一致性流量。
- UMA（對稱多處理器）與 NUMA（存取遠端記憶體較慢）。

> [!陷阱] 多選題常見敘述
> - 「cache 一致性協定可以保證程式在任何記憶體一致性模型下都正確」✗：一致性（coherence）只管同一個位址，記憶體一致性（consistency）管不同位址之間的順序。
> - 「MESI 中 E 狀態的區塊被寫入時要廣播 invalidate」✗。
> - 「directory 協定需要廣播」✗。
> - 「VIPT cache 永遠不會有別名問題」✗，要滿足大小條件。
