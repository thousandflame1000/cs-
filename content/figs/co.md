=== co-perf 1
```fig
flow: 指令數 IC -> × 每條幾個週期 CPI -> × 每個週期幾秒 -> = CPU 時間*
cap: 效能鐵律：三個數字一起看。只看時脈 GHz 會被騙（CPI 可能變大）
```

=== co-perf 2
```fig
flow: 要比什麼？ -> 執行時間 | 速率（MIPS、throughput） | 相對參考機的倍數（SPEC） -> 算術平均 | 調和平均 | 幾何平均*
cap: 平均要用對：SPEC 用幾何平均，選哪台當參考機都不會改變誰比較快
```

=== co-perf 3
```fig
bars
bar 1 核: 1 1 倍
bar 2 核: 1.82 1.82 倍
bar 4 核: 3.08 3.08 倍
bar 8 核: 4.71 4.71 倍
bar 16 核: 6.4 6.4 倍
bar 無限多核: 10 最多 10 倍!
cap: 九成可以平行（f = 0.9）：剩下一成只能一個人做，核再多也不會超過 1/(1−0.9) = 10 倍
```

=== co-perf 4
```fig
bars
bar 原本: 100 100%
bar 電壓、頻率各降 15%: 61 61% +
cap: 動態功耗 ∝ C·V²·f：電壓是平方，0.85² × 0.85 ≈ 0.61，只降一點點就省很多電
```

=== co-arith 1
```fig
array
row 4 位元: 0111 0001 0000 1111 1000
row 二補數: 7 1 0 −1* −8!
cap: 4 位元二補數範圍是 −8～7。最高位的權重是 −8：1111 = −8 + 4 + 2 + 1 = −1
```

=== co-arith 2
```fig
flow: c(i+1) = g(i) + p(i)·c(i) -> g：這一位自己就會進位（a 且 b） | p：這一位會把進位傳下去（a 或 b） -> 把式子展開：每個進位都直接從 c₀ 算，不用一位等一位*
cap: Carry lookahead：ripple carry 要排隊 O(n)，先算好 g、p 就能平行算出所有進位
```

=== co-arith 3
```fig
array
row 開始: 0000 1101 0
row 1（10：−M）: 1111 0110 1
row 2（01：+M）: 0000 1011 0
row 3（10：−M）: 1111 0101 1
row 4（11：不動）: 1111* 1010* 1
cap: Booth 算 2 × (−3)：三欄是 A、Q、q₋₁；看 Q 的最低位和 q₋₁ 決定加減 M，再整體算術右移。結果 A:Q = 1111 1010 = −6
```

=== co-arith 4
```fig
bits: 符號 1* | 指數 8 | 小數 23
---
bits: 符號 1* | 指數 11 | 小數 52
cap: 上：單精度（偏移 127）；下：倍精度（偏移 1023）。值 = (−1)^符號 × 1.小數 × 2^(指數 − 偏移)
```

=== co-datapath 1
```fig
bits: op 6 | rs 5 | rt 5 | rd 5 | shamt 5 | funct 6
---
bits: op 6 | rs 5 | rt 5 | 立即值 16*
cap: MIPS 的 R 型（上）和 I 型（下）指令：都是 32 位元，欄位位置固定，解碼才快
```

=== co-datapath 2
```fig
flow: PC -> 指令記憶體 -> 讀暫存器 -> ALU -> 資料記憶體 -> 寫回暫存器*
cap: lw 要走完整條路。單週期的時脈必須等最慢的指令（lw）走完，所以時脈很長
```

=== co-datapath 3
```fig
bars
bar lw: 5 5 個週期
bar sw: 4 4
bar R 型: 4 4
bar beq: 3 3
bar j: 3 3
cap: 多週期：每條指令只走自己需要的步驟，平均 CPI 依指令比例加權
```

=== co-pipeline 1
```fig
lanes
指令1: 0 IF ID EX MEM WB
指令2: 1 IF ID EX MEM WB
指令3: 2 IF ID EX MEM WB
指令4: 3 IF ID EX MEM WB
cap: 5 級管線跑 4 條指令：5 + 4 − 1 = 8 個週期。每條本身沒變快，是「同時做好幾條」變快
```

=== co-pipeline 2
```fig
lanes
add: 0 IF ID EX* MEM WB
sub: 1 IF ID EX* MEM WB
cap: forwarding：add 在 EX 算完，下一拍就直接送進 sub 的 EX，不用等它寫回暫存器
```

=== co-pipeline 3
```fig
array
row 2 位元預測器: 強不跳 弱不跳 弱跳* 強跳*
cap: 每次真的「跳」往右一格、「不跳」往左一格；在右邊兩格就預測跳。要連錯兩次才會改變預測，迴圈結尾那一次猜錯不會亂掉
```

=== co-pipeline 4
```fig
flow: 例外發生 -> 前面的指令做完、後面的清掉 -> PC 存進 EPC、原因存進 Cause -> 跳到處理程式*
cap: 精確例外：看起來就像「在這條指令之前剛好停下來」
```

=== co-ilp 1
```fig
array
row RAW（真相依）: i寫R1 -> j讀R1+
row WAR（反相依）: i讀R1 -> j寫R1*
row WAW（輸出相依）: i寫R1 -> j寫R1*
cap: 綠的是真的要等資料；藍的只是「名字撞到」，換個暫存器名稱就消失
```

=== co-ilp 2
```fig
flow: Issue（擋 WAW、結構） -> 讀運算元（等 RAW） -> 執行 -> 寫回（擋 WAR）
cap: Scoreboard 沒有換名，所以 WAR、WAW 也只能用「等」的
```

=== co-ilp 3
```fig
flow: 指令 -> 保留站（存值，或存「誰會算出來」的標籤） -> 功能單元 -> CDB 廣播結果 -> 等這個標籤的保留站和暫存器同時收到*
cap: Tomasulo：保留站的標籤就是換名，WAR、WAW 自然消失
```

=== co-ilp 4
```fig
array
row ROB（照程式順序）: #1完成+ #2完成+ #3還在算* #4完成
cap: 結果先放 ROB，只能從頭依序 commit：#1、#2 可以寫回，#4 做完也要等 #3。猜錯分支時，把後面的整段清掉就好
```

=== co-ilp 5
```fig
array
row 週期1: A A _ _
row 週期2: A _ _ _
row 週期3: _ _ _ _
---
array
row 週期1: A A _ _
row 週期2: B* _ _ _
row 週期3: C+ C+ C+ _
---
array
row 週期1: A A B* C+
row 週期2: B* C+ C+ A
row 週期3: A B* _ C+
cap: 每格是一個發射槽，字母是哪個執行緒。左：單執行緒超純量；中：細粒度多執行緒（每週期換一個）；右：SMT（同一週期混用），空格最少
```

=== co-cache 1
```fig
bits: tag 18 | index 8* | offset 6
cap: 32 位元位址、16 KiB 直接對映、區塊 64 B：offset = lg 64 = 6、index = lg 256 = 8，剩下 18 位是 tag
```

=== co-cache 2
```fig
flow: 寫入命中 -> Write-through：同時寫 cache 和下一層 | Write-back：只寫 cache，標記 dirty -> 簡單，但寫入流量大（配 write buffer） | 被換出時才寫回，省頻寬*
cap: 兩種寫入策略；write-back 通常搭配 write-allocate
```

=== co-cache 3
```fig
array
row 加大容量: Capacity↓+ Conflict↓+
row 提高關聯度: Conflict↓+ hit_time↑!
row 加大區塊: Compulsory↓+ 太大時miss↑!
cap: 3C：第一次一定 miss（Compulsory）、裝不下（Capacity）、撞位子（Conflict）。每種調整只解決其中幾種，也有代價
```

=== co-cache 4
```fig
bars
bar 命中時間: 1 1
bar miss 率 × 懲罰: 5 0.05 × 100 = 5
bar AMAT: 6 6 個週期 *
cap: AMAT = 命中時間 + miss 率 × miss 懲罰。miss 只有 5%，卻占了大部分的時間
```

=== co-cache 5
```fig
bars
bar 一個 word 寬: 65 1 + 4×15 + 4×1 = 65!
bar 四個 bank 交錯: 20 1 + 15 + 4×1 = 20
bar 四個 word 寬: 17 1 + 15 + 1 = 17 +
cap: 一次搬 4 個 word 的 miss 懲罰（送位址 1、DRAM 15、傳一個 word 1 週期）
```

=== co-cache 6
```fig
array
row 照列走（好）: a00+ a01+ a02+ a03+
row 照行走（壞）: a00! a10! a20! a30!
cap: C 的陣列是一列一列存的：照列走，連續的元素在同一個區塊，cache 一直命中；照行走，每一步都跳到別的區塊（loop interchange 就是把迴圈對調）
```

=== co-vm-coherence 1
```fig
flow: 虛擬位址 -> 查 TLB -> 命中：直接拿到實體頁框+ | 沒中：走頁表，再放進 TLB -> 實體位址 -> 查 cache
cap: TLB 是「頁表的 cache」。頁不在記憶體時，TLB 不可能命中
```

=== co-vm-coherence 2
```fig
array
row 狀態: M（改過，只有我有） S（乾淨，可能好幾份） I（無效）!
cap: MSI：別人要寫這個區塊時，我的副本變成 I（write-invalidate）；我要寫時先讓別人的都變 I
```

=== co-vm-coherence 3
```fig
array
row P1: x=1 r1=y
row P2: y=1 r2=x
cap: 初值 x = y = 0。循序一致（SC）下 r1 = r2 = 0 不可能；x86 的 TSO 有 store buffer，寫入還沒出去就先讀，可能出現
```

=== co-vm-coherence 4
```fig
flow: 先一般讀 lock（在自己的 cache 上轉圈） -> 看起來是 0？ -> 是：才做原子 test-and-set* | 否：繼續讀，不佔匯流排
cap: test-and-test-and-set：等的時候只讀自己的 cache，鎖放開才搶，一致性流量少很多
```
