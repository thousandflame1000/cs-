=== co-perf 1
程式跑多久＝指令條數 × 每條平均幾個週期（CPI）× 一個週期多長。三個要一起看，只看時脈會被騙。

=== co-perf 2
比時間用算術平均、比速率用調和平均、比 SPEC 分數用幾何平均。

=== co-perf 3
Amdahl：只加速其中一部分，整體最多快到 $\frac{1}{1-f}$ 倍。例：90% 能加速，再怎麼快也只有 10 倍。

=== co-perf 4
功耗跟電壓的平方成正比；電壓降不下去，時脈就衝不上去，所以 CPU 改走多核心。

=== co-arith 1
二補數取負：全部位元反過來再加 1。同號相加結果卻變號，就是溢位。

=== co-arith 2
最簡單的加法器一位一位等進位（慢）；Carry lookahead 先算好「會不會產生、會不會傳遞進位」，一次算出來（快）。

=== co-arith 3
Booth 乘法看乘數相鄰兩位：`10` 減被乘數、`01` 加被乘數、其他不動，然後整體右移一位。

=== co-arith 4
IEEE 754 浮點數＝正負號 × $1.f$ × $2^{\text{次方}}$；次方要先減掉 bias（單精度是 127）。

=== co-datapath 1
RISC 指令長度固定、只有 load／store 碰記憶體；CISC（x86）指令長短不一、可以直接算記憶體裡的值。

=== co-datapath 2
單週期：每條指令一個週期做完，但週期得配合最慢的指令（lw），所以時脈很慢。

=== co-datapath 3
多週期：把指令切成幾個小步、一步一個週期，快的指令少用幾步，硬體也可以重複使用。

=== co-pipeline 1
管線像洗衣店：洗、烘、摺同時做不同批。$k$ 級、$n$ 條指令共 $k+n-1$ 個週期；單一指令並沒有變快。

=== co-pipeline 2
後一條要用前一條剛算出的值：先把結果「抄近路」送過去（forwarding）。但 lw 的值太晚才出來，還是得停一格。

=== co-pipeline 3
遇到分支還不知道要不要跳，先猜；猜錯就把多抓的指令丟掉。2-bit 預測器要連錯兩次才改猜法。

=== co-pipeline 4
精確例外：出事那條指令之前的都做完、之後的都當作沒發生，再跳去處理。

=== co-ilp 1
真相依（RAW）一定要等；WAR、WAW 只是「名字撞到」，換個暫存器名字就沒事了。

=== co-ilp 2
Scoreboard 不會換名，所以遇到 WAR、WAW 只能乾等。

=== co-ilp 3
Tomasulo：在發射時就幫暫存器換名，結果用 CDB 廣播給所有在等的人，所以 WAR、WAW 都消失了。

=== co-ilp 4
加上 ROB 後，結果先放 ROB，照原本順序 commit；猜錯時把後面的全部丟掉就好，例外也變精確。

=== co-ilp 5
一次發射多條指令：靠硬體決定是超純量，靠編譯器打包是 VLIW。SMT 讓好幾個執行緒共用空著的發射位置。

=== co-cache 1
cache 位址切三段：offset 決定在區塊的哪個 byte、index 決定放哪一格、tag 用來確認是不是要的那個。

=== co-cache 2
寫入策略：write-through 每次都同時寫下一層；write-back 只寫 cache，被換出去時才寫回。

=== co-cache 3
miss 有三種：第一次一定 miss（Compulsory）、放不下（Capacity）、格子撞到（Conflict）。改不同參數，各降不同的 miss。

=== co-cache 4
平均存取時間 AMAT＝命中時間＋miss 率 × miss 懲罰。

=== co-cache 5
miss 懲罰看記憶體一次搬多少：一次一個 word 要等四次 DRAM，四個 bank 交錯只要等一次。

=== co-cache 6
進階最佳化都在做三件事之一：讓命中更快、讓 miss 更少、讓 miss 的懲罰更小。

=== co-vm-coherence 1
查位址的順序：先 TLB，再頁表，最後 cache。頁不在記憶體時，TLB 跟 cache 都不可能有它。

=== co-vm-coherence 2
多核心各有 cache，同一個位址的值要一致：一個人寫入時，其他人手上的副本作廢（MESI）。

=== co-vm-coherence 3
記憶體一致性模型管「不同位址」的讀寫順序：循序一致最嚴格；x86 的 TSO 允許「先存後讀」被提前。

=== co-vm-coherence 4
硬體提供不可分割的原子操作（test-and-set、LL/SC），軟體才能做出鎖。
