/* 114 年台大資工／AI 聯招原卷。配分依 PDF，題號沿用卷面。 */
'use strict';

const NTU_PAPERS = [
  { id: 'dsa', file: '114-295.pdf', name: '資料結構與演算法', time: '08:10–09:50',
    rules: '第 1–7 題單選，第 8–17 題複選。每題 5 分；複選逐選項判斷，每項 1 分，整題空白 0 分。第 18、19 題寫在卷本，第 18 題無部分分。',
    items: Array.from({ length: 17 }, (_, i) => [String(i + 1), 5, [
      'al-prob#1', 'al-recurrence#3', '', 'al-dp#2', 'ds-graph#1', 'al-dp#2', 'al-mst-flow#2', 'al-recurrence#1', 'al-recurrence',
      'ds-bst#2', 'ds-hash', 'al-mst-flow#1', 'al-sp#2', 'al-mst-flow#2', 'al-dp#1', 'al-np#3', 'al-np#2',
    ][i]]).concat([['18', 5, 'ds-amortized#4'], ['19a', 5, 'al-np#2'], ['19b', 5, 'al-np#4']]) },
  { id: 'sys', file: '114-294.pdf', name: '計算機結構與作業系統', time: '10:30–12:10',
    rules: '作業系統（1–9）和計算機結構（10–18）各 50 分。第 6–12 題複選，各選項分開計分，判錯不倒扣；其餘為單選。',
    items: [5, 5, 3, 7, 10, 5, 5, 5, 5, 8, 5, 6, 5, 4, 4, 4, 8, 6].map((max, i) => [String(i + 1), max, [
      'os-sync#3', 'os-storage#2', 'os-process#2', 'os-memory#4', 'os-vm#3', 'os-storage#4', 'os-sched#2', 'os-sched#3', 'os-process#3',
      'co-datapath', 'co-perf#1', 'co-pipeline#1', 'co-pipeline#2', 'co-cache#1', 'co-vm-coherence#1', 'co-ilp#1', 'co-ilp#1', 'co-ilp#5',
    ][i]]) },
  { id: 'en', file: '114-8.pdf', name: '英文（A）', time: '13:40–15:20',
    rules: '50 題單選，每題 2 分。第 1–20 題字彙、第 21–35 題克漏字、第 36–50 題閱讀。原始分數乘 0.1 計入總分。',
    items: Array.from({ length: 50 }, (_, i) => [String(i + 1), 2, i < 20 ? 'en-reading#2' : i < 35 ? 'en-reading#5' : 'en-reading#4']) },
  { id: 'math', file: '114-296.pdf', name: '數學（A）', time: '16:00–17:40',
    rules: '在試卷畫表填答。第 7 題複選全對才給分。第 8 題分成兩小題，各 10 分。',
    items: [['1', 5, 'dm-graph#2'], ['2', 5, 'dm-logic#1'], ['3', 10, 'dm-relations#1'], ['4', 10, 'dm-recur-gf#2'],
      ['5', 10, 'dm-recur-gf#5'], ['6', 10, 'dm-counting#1'], ['7', 10, 'la-vs#2'], ['8A', 10, 'la-ortho#1'],
      ['8B', 10, 'la-ortho#2'], ['9', 10, 'la-det#1'], ['10', 10, 'la-eigen#1']] },
];

// 依原卷解題整理。核分仍由考生依紙本答案確認。
const PAPER_REFERENCES = {
  en: Object.fromEntries([
    'A D A D B A C B C A', 'C A A C A D D C A B',
    'D C A B A B B D C D', 'D A B B A A B A B A', 'C D B C B C C A C B',
  ].join(' ').split(' ').map((answer, i) => [String(i + 1), answer])),
  math: {
    '1': 'C。逐點數入度與出度，C 的各點均相等且連通。A 的 2、B 的 8、D 和 E 的 4 都有入出度不平衡。',
    '2': '3。第一項固定 $w,x,y$，留下 $z$ 自由，有 2 組。第二項固定四個變數，有 1 組。兩項的 $x$ 相反，不會重複。',
    '3': String.raw`9。直積有 20 個元素，關係有 $2^{20}$ 種，取模 13 得 9。`,
    '4': String.raw`$a_n=\frac{17}{7}2^n+\frac{4}{7}(-5)^n$。特徵根是 2 與 −5，係數用兩個初值解出。`,
    '5': String.raw`$\frac{17}{7(1-2x)}+\frac{4}{7(1+5x)}$。對第 4 題兩個等比數列分別取普通生成函數。`,
    '6': String.raw`$\binom{11}{4}=330$。加上一個補足到 7 的非負整數，把不等式轉成五個變數的和等於 7。`,
    '7': 'A、B、E。用係數或矩陣元素排成向量，各組秩為 3、4、4、2、3。C 的前三個矩陣之和等於後兩個之和，D 的第三個向量是第一、第二個之和。',
    '8A': String.raw`$\begin{pmatrix}2&0&2/3&0\\0&2/3&0&2/5\\2/3&0&2/5&0\\0&2/5&0&2/7\end{pmatrix}$。逐格積分 $\int_{-1}^1 x^{i+j}\,dx$（$i,j=0,1,2,3$）。`,
    '8B': String.raw`$10/9$。以 $p=x^3-3x/5$，係數為 $\langle x^5,p\rangle/\langle p,p\rangle$。`,
    '9': String.raw`$(1-a^2)^n$。由最後一列往上，每列減前一列的 $a$ 倍，得到上三角矩陣，對角線為 1 及 $n$ 個 $1-a^2$。`,
    '10': String.raw`$f(A)$ 的最大特徵值為 2。原矩陣兩個對角塊的特徵值是 1、1、2 與 2、3，代入多項式得到 2、2、1、1、−8。`,
  },
  dsa: {
    '1': 'C。遞迴樹恰有 n 個大小為 1 的葉節點。星號的期望滿足 T(n) = n + 2ΣT(j)/(n−1)，其中 j 從 1 到 n−1。相鄰兩式相減可得 T(n)/n − T(n−1)/(n−1) = 2/n，故為 Θ(n log n)。',
    '2': 'B。Akra–Bazzi 定理的常見版本會對遞迴的額外成本函數加上多項式增長條件。它可以處理不等長子問題，特徵指數可為實數，結果是漸近界。',
    '3': '依命題常見假設可選 E。每輪成本為 O(nkd)，固定群數 k = 3、序列長度 d = 6，且把輪數視為常數時為 O(n)。若問到收斂為止的總複雜度，還要乘迭代輪數。A–D 的「一定」也無法從題給條件推出。',
    '4': 'C 是標準遞迴式。斜移加配對得分，上移或左移扣 2，三者取最大。原題指定單選，但 B 對題目所提的完整 m × n 動態規劃表也成立。只計分數時可改用滾動列，因此空間並非必須使用整張表。',
    '5': 'E。按無向簡單圖，每對相鄰原子算一條邊，兩輪同步更新後排序為 5、10、11、3、9、4、6、7、8、12、13、1、2。第 3、9 點同為 12，第 4、6 點同為 11，依小標號優先。若雙鍵視為平行邊，排序仍不在 A–D。',
    '6': 'D。容量 17 的最高價值是 24，例如拿兩個大小 7、價值 10，再拿一個大小 3、價值 4。用完全背包遞迴檢查其餘組合後，十位與個位相加為 6。',
    '7': 'D。讓 A、B、C 最多各再贏 1、5、7 場，D 最多 13 場。ABC 互打 14 場只能流 13，三隊與 D 另有 12 場，故上界 25。AB 的 5 場給 B，AC 分給 A 1 場、C 6 場，BC 的 2 場給 C 1 場，與 D 的 12 場全給 D，即可達 25。',
    '8': 'C、E。兩個二項係數的階分別是 n⁵ 與 n⁴。其餘三式取對數後，階依序為 log⁴ n（f₂）、√n（f₄）和 log³ n（f₅）。因此 f₃ < f₁ < f₅ < f₂ < f₄（按漸近增長率）。',
    '9': 'B、C、D、E。A 為 Θ(n log n)。B 由 7 個半規模子問題主導。C 的 log 成本逐層減半。D 的指數為 n + (n−1) + … + 1，固定基底的差只改常數。E 的子問題規模總和只有 17n/18，各層成本形成幾何級數。',
    '10': 'D。先線性合併三個已排序陣列並去重，再以中點遞迴建樹，總工作量線性。一般 BST 可退化成鏈，後繼查找要沿樹走。用有父指標或前驅表的 BFS 找路，走訪加重建最多 O(n)。',
    '11': 'A、B。這裡的 uniform 按每個鍵獨立均勻散列理解。兩種情形每對碰撞率至多 1/m，合計 O(√n)。若只要求各鍵邊際均勻，A 不成立，所有鍵一起映到一個隨機桶就是反例。C–E 所用的模 m 公式會讓同餘鍵必碰撞。取 n = t²、m = t³，選滿 t 個大小為 t 的同餘組，就有 Θ(n√n) 對必碰撞。',
    '12': 'C、D。所有 MST 在每個權重層用的邊數相同，因為對每個門檻都取了最大森林，所以對稱差中每個出現的權重至少有一對。等正權 K₄ 有兩棵邊互斥的生成樹，對稱差重量可超過任一棵。A 可用 K₄ 的星形樹與其餘頂點上的路徑接一條星邊反駁。B 可在兩個不同權重的環各換一條邊反駁。E 可按權重分層：縮掉較輕邊所連通的分量後，本層可獨立選兩棵最大森林。負權層讓兩棵選一樣。正權層用擬陣聯集找兩棵森林聯集的最大邊數，各自補成最大森林，便最大化對稱差。',
    '13': 'D。最短路更新要保留較小者。瓶頸路應取 min(舊值, max(到目前的瓶頸, 新邊重))。Prim 要回傳所有入樹鍵值之和，且允許負權。這三種正確更新都能用 Fibonacci heap 實作。',
    '14': '按最小割常用的非負容量模型，選 C。雙向建邊時每條跨割邊只在從源側指向匯側的方向計一次，Dinic 的 O(V²E) 在方格為 O(n⁶)。A 的反例是 4×4 方格，把 (1,1)、(1,2)、(2,2)、(2,3)、(3,2) 與其餘點之間的 9 條邊設為 1，其他邊設為 100，兩側各自連通，因此唯一最小割跨 9 條。B、D 把平面對偶圖的分隔路徑誤放在原圖。題面沒寫非負，若允許負權，C 的流量模型也不適用。',
    '15': '按原式選 E。每條原本同色的父子邊至少要改一端，因此是同色分量上的最小加權頂點覆蓋。B 只從同色分量的葉往下遞迴，漏掉掛在分量內部節點上的異色子樹。D 的反例是一條同色三點鏈，改色成本由上到下為 100、5、1，根的另一個孩子是異色葉。只改中間點花 5 即可，D 卻再加了子樹無條件的最小值 1。',
    '16': 'A、B、D、E。枚舉 16 組布林值有 8 組可行，整數最優為 7，有 2 組。放寬後三條不等式分別乘 2/5、1/5、2/5 再相加，可證目標上界為 8。唯一達界點為 (8/9, 0, 8/9, 8/9)，因此有整數差距，最優集合的三維體積為 0。可行域也嚴格少於整個單位立方體。',
    '17': 'A、B、D。A 選項的前提會使 P = NP，加上已知問題 B 在 NP 即可。B 選項中，問題 C 可經 E 歸約回 B 而在 NP，又承接 B 的困難性，故是 NP-complete，問題 D 也至少一樣難。D 選項的 NP 上界沿歸約往回傳。C、E 選項把 NP 上界或 NP-hard 下界傳錯方向。',
    '18': String.raw`令 $w_i=1+c_i$，其中 $c_i$ 是卷面定義的第 $i$ 位寫入成本。取 $\Phi(A)=\sum_i A[i]p_i$，其中 $p_i=2^i(8-\sum_{j<i}w_j/2^j)-w_i$。因 $w_j\le 1+(3/2)^j$，內部和不超過 6，所以 $p_i\ge0$。若進位停在第 $i$ 位，實際讀寫成本是 $\sum_{j\le i}w_j$，加上勢能差 $p_i-\sum_{j<i}p_j$ 恰為 8。`,
    '19a': String.raw`從正整數 Subset Sum 歸約。若項數為偶數，加入一個大於目標的元素，使項數 $n$ 為奇數。取 $M=3^n$、$B=2n+1$。對第 $i$ 個元素 $a_i$（$i=0,\ldots,n-1$）製作兩個不同奇數 $2B(Ma_i+3^i)+1$ 和 $2B\cdot3^i+1$。目標是 $2B(Mk+\sum_i3^i)+n$。模 $2B$ 強制選 $n$ 個，三進位各位強制每對選一個，高位要求原元素和為 $k$。反向依解選取每對其一。用選取集合當證明即可在多項式時間驗證，因此屬於 NP。`,
    '19b': String.raw`刪掉大於 $k$ 的元素。若集合空，回傳 0。否則取剩餘項數 $n$、最大元素 $M$，令 $K=\epsilon M/n$，每項 $a$ 的縮放分數為 $\lfloor a/K\rfloor$。用 0–1 動態規劃，對每個縮放總分保留可達到的最小原始和，超過 $k$ 的狀態丟棄。最後取可達到的最高縮放總分，回傳該狀態的原始和。總分上限為 $n^2/\epsilon$。把原最優解的分數向下取整最多損失 $nK=\epsilon M\le\epsilon k^*$。`,
  },
  sys: {
    '1': 'D。所有行程遵守先取鎖、後改共享資料、完成後放鎖，才能用互斥保護臨界區。記憶體屏障約束順序，獨立的讀取與寫入即使各自原子也不會把整個讀改寫合成一個動作。計數 semaphore 大於 1 時可容多人，但無法提供本題要求的互斥。',
    '2': 'B。RAID 5 將同位元分散在各碟，可重建單碟故障。並行本身不提高可靠度。常用雙碟獨立故障近似為 100000²/(2×10) 小時，約 57,000 年。RAID 10 是對鏡像組做條帶化。',
    '3': 'A。假設 fork 成功，子行程改自己的 value 成 20，父行程等它結束後仍讀到 10，所以 20 + 10² = 120。',
    '4': '取相鄰整數界時選 A。P = 16、L = 21、倒排表 N = 32。把 60% 和 90% 當作頁面命中率，並用頁面錯誤服務時間近似失敗路徑。一般命中約 360 ns，TLB 命中約 200 ns，加權比約 3.9998，取 A = 3、B = 4，代入得 293。原卷沒明說要取相鄰整數，若容許寬鬆的界，A、B 的值不唯一。',
    '5': 'B。8 KB 頁面給 D = 13、P = 19。將相同頁代成同一代號，序列是 1、2、1、2、3、4、3、4、2、5。六次參考窗口最多 4 頁，頁面錯誤發生在第 1、2、5、6、7、10 次，所以 M + D + P + F = 42。',
    '6': '依圖示流程選 D、E。已有全系統開檔項目時，建立本行程的描述符即可，不必再查磁碟目錄。第一次開啟已存在的檔案，要讀 FCB 並建立全系統開檔項目。描述符屬於本行程，普通 open 找不到檔案時也不等於要求建立檔案。',
    '7': '原卷沒給時間片，無法唯一核分。以表列順序、切換成本為零，q = 1 時平均等待 15.0，只有 D；q = 2 時為 15.2，A、C、D 都成立。先確認採用的時間片再核分。',
    '8': 'A。第一批工作到時間 10 一共需 45 個 CPU 週期，DM 和 RM 都無法讓全組準時。DM 先執行 P₃ 五個週期，P₄ 即使在四個相同 deadline 的工作中排第一，最快仍在 15 完成。P₂ 的回應時間會受同 deadline 順序和搶先影響，增加自身工作也可能多遇到高優先權工作。',
    '9': 'B、C。單核心可用交錯執行得到 concurrency。pthread_join 會等待目標執行緒結束。兩核心不保證兩倍加速，等待中的行程須先變成就緒，編譯時位址繫結是靜態的。',
    '10': '按原卷反組譯，A–D 均不完全相符。陣列步距是 5×8 = 40，首項由結構起點偏移 8，lst 在 0x120，因此 CN = (288−8)/40 = 7。相對元素起點，idx 在 0、x 在 8，x 的元素是 8 bytes，可用 {long idx; long x[4];}。D 雖符合元素大小及 CN，但額外的 long idx1 讓 x 往後偏 8 bytes。',
    '11': 'A、D。同一個 1 ns 時脈下，A、B 分別用 15 億、18 億週期，CPI 是 1.5、1.2。若假設新機器保留各自週期數，要同時間完成，A 只需 B 的 5/6 頻率。C 用 3.2 億週期，相對 A 為 4.6875 倍，相對 B 為 5.625 倍。',
    '12': 'C、D。五階段中最慢為 250 ps，流水線 LW 要 5×250 = 1250 ps。非流水線各階段相加為 750 ps。只在 LW、SW 使用資料記憶體，穩態利用率為 20% + 15% = 35%。',
    '13': '依有 load delay slot、程式沒填空檔的解讀選 A。緊接的 add 讀到舊 x3 = 24，故 x4 = 48。若題目的 ignored 指處理器忽略這個硬體限制，使 add 讀到載入的新值 −4，則為 C。兩種解讀的差異在 add 看到哪個值。',
    '14': 'C。每個 set 的 tag store 包含兩份 tag、valid、dirty，再加一個 2-way LRU bit，故是 2t+5（奇數）。總位元數 13×256，set 數為 2 的冪，只有 256 組會讓每組位數為奇數。因此資料容量為 256×2×8 B = 4 KB。',
    '15': 'A。由第 14 題得 set index 需要 8 bits。1 KB 頁面有 10 位頁內偏移，8 B block 用掉 3 位，頁內只剩 7 位可供索引，所以還要從 VPN 借 1 位。',
    '16': '依把延遲當成「發射後需隔開的完整拍數」的讀法，圈內兩次 load 在第 1、2 拍，add 第 9 拍，store 第 14 拍，整數更新和分支為第 15、16 拍。共 3 + 16×1099 = 17587（B）。若延遲 L 代表第 t 拍發射、第 t+L 拍就能使用結果，則圈內只需 14 拍，總計 15389，未列在選項。核分時先確認採用的時序定義。',
    '17': '在單發射、結果可用即發射、整數與分支各一拍的模型可得 A。三條設定與兩次初始 load 後，第 11 拍開始迴圈。每圈按第 1 拍 fadd、第 2 拍移動前值、第 3 拍更新位址、第 5 拍用 −8 offset 存回、第 6 拍移動新值、第 7 拍分支。共 10 + 7×1099 = 7703。這依賴題面未明示的發射模型。',
    '18': '在可將 Y 兩拍排完、X 四拍排完，並以各核心活動期間計算空檔的模型選 B。X 可排 A1、等待、A2 與 A3、A4。Y 可排 B2 與 B3、B1 與 B4，須假設同拍的指令使用不同單元。若扣掉 A1 額外佔用的那一格，活動期間有 3 個空格。若計入 Y 做完後的所有空格，或只數發射格不扣多週期佔用，結果會不同。',
  },
};

const Papers = {
  duration: 100 * 60000,
  timer: null,
  get data() { return S.st.papers114; },
  load() {
    if (!this.data || !Array.isArray(this.data.runs)) S.st.papers114 = { runs: [] };
  },
  save() {
    if (!S.saveNow()) toast('本機空間不足或無法存取，請先下載備份或留存紙本成績', 'bad');
  },
  run() { return this.data.runs[this.data.runs.length - 1]; },
  newRun() {
    this.data.runs.push({ id: Date.now() + '-' + Math.random().toString(36).slice(2, 8), date: D.today(), papers: {} });
    this.save();
    this.view();
  },
  paper(id) { return NTU_PAPERS.find(paper => paper.id === id); },
  elapsed(attempt) { return Math.round(((attempt.submitted ?? Date.now()) - attempt.start) / 1000); },
  clock(seconds) {
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  },
  score(paper, attempt) {
    const scores = paper.items.map(([id]) => attempt?.scores[id]).filter(Number.isFinite);
    const points = Math.round(scores.reduce((sum, value) => sum + value, 0) * 100) / 100;
    return { points, count: scores.length, complete: scores.length === paper.items.length };
  },
  total(run) {
    if (!run) return null;
    const scores = NTU_PAPERS.map(paper => this.score(paper, run.papers[paper.id]));
    if (!scores.every(score => score.complete)) return null;
    const total = scores.reduce((sum, score, index) => sum + score.points * (NTU_PAPERS[index].id === 'en' ? .1 : 1), 0);
    return Math.round(total * 1000) / 1000;
  },
  link(paper) {
    const folder = location.protocol === 'file:' ? '../考古題/' : 'papers/';
    return folder + paper.file;
  },
  openPaper(paper) {
    window.open(this.link(paper), '_blank', 'noopener');
  },
  start(id) {
    const run = this.run();
    if (!run || run.papers[id] || Object.values(run.papers).some(attempt => !attempt.submitted)) return;
    run.papers[id] = { start: Date.now(), submitted: null, scores: {}, corrections: {} };
    this.save();
    this.openPaper(this.paper(id));
    location.hash = '#papers/' + id;
  },
  handIn(attempt) {
    if (attempt.submitted) return;
    attempt.submitted = Math.min(Date.now(), attempt.start + this.duration);
    this.save();
  },
  reconcile() {
    for (const attempt of Object.values(this.run()?.papers || {})) {
      if (!attempt.submitted && Date.now() >= attempt.start + this.duration) this.handIn(attempt);
    }
  },
  view(path = '') {
    this.load();
    clearInterval(this.timer);
    this.reconcile();
    const [id, archivedId] = path.split('/');
    const run = archivedId ? this.data.runs.find(row => row.id === archivedId) : this.run();
    const paper = this.paper(id), attempt = run?.papers[id];
    if (paper && attempt) return attempt.submitted ? this.mark(paper, run, attempt) : this.sitting(paper, attempt);

    const total = this.total(run);
    const active = Object.values(run?.papers || {}).some(row => !row.submitted);
    main().innerHTML = `<header class="page-head"><h1>114 年台大原卷模考</h1>
      <p>四科各 100 分鐘。備妥紙筆，開始後計時不中斷，交卷後核分。成績保存在此瀏覽器。</p>
      <p>${total == null ? '總分待四科核分' : `本輪核分 <b>${total} / 310</b>`}</p></header>
      <div class="mode-grid">${NTU_PAPERS.map(paper => {
        const attempt = run?.papers[paper.id], score = this.score(paper, attempt);
        const text = score.complete ? `${score.points} / 100` : attempt?.submitted ? `待核分 ${paper.items.length - score.count} 題` : attempt ? '繼續作答' : paper.time;
        return `<button class="mode" data-paper="${paper.id}" ${active && !attempt ? 'disabled' : ''}><b>${paper.name}</b><span>${text}</span></button>`;
      }).join('')}</div>
      ${total != null ? '<div class="row"><button class="btn" id="paperNewRun">開始新一輪</button></div>' : ''}
      ${this.historyHtml()}
      <div class="row"><a class="btn" href="#practice">回練習</a></div>`;
    $$('[data-paper]').forEach(button => button.onclick = () => {
      const id = button.dataset.paper;
      if (!this.run()) { this.newRun(); }
      if (this.run().papers[id]) { location.hash = '#papers/' + id; return; }
      this.prepare(this.paper(id));
    });
    if ($('#paperNewRun')) $('#paperNewRun').onclick = () => this.newRun();
  },
  historyHtml() {
    const older = this.data.runs.slice(0, -1).reverse();
    if (!older.length) return '';
    return `<details class="card"><summary>歷次原卷成績</summary>${older.map(run => `<div class="row wrap"><b>${esc(run.date)}　${this.total(run)} / 310</b>${NTU_PAPERS.map(paper => `<a href="#papers/${paper.id}/${run.id}">${paper.name}</a>`).join('')}</div>`).join('')}</details>`;
  },
  prepare(paper) {
    main().innerHTML = `<header class="page-head"><h1>${paper.name}</h1><p>${paper.rules}</p>
      <p>閉卷、紙筆作答。開始後另開原卷分頁，計時留在本站。</p></header>
      <div class="row"><button class="btn primary" id="paperStart">開始 100 分鐘</button><button class="btn" id="paperBack">返回</button></div>`;
    $('#paperStart').onclick = () => this.start(paper.id);
    $('#paperBack').onclick = () => this.view();
  },
  sitting(paper, attempt) {
    main().innerHTML = `<header class="page-head"><div class="eyebrow">114 年台大原卷</div><h1>${paper.name}</h1>
      <p>${paper.rules}</p><p>時間到停止作答，系統會收卷。</p>
      <div class="row wrap"><b class="exam-clock" id="paperClock" role="timer"></b><button class="btn primary" id="paperSubmit">交卷</button>
      <button class="btn" id="paperPdf">開啟原卷 PDF</button></div></header><a href="#papers">回模考總覽</a>`;
    $('#paperPdf').onclick = () => this.openPaper(paper);
    $('#paperSubmit').onclick = () => {
      if (!confirm('確認交卷？交卷後這一節計時結束。')) return;
      this.handIn(attempt);
      this.view(paper.id);
    };
    const tick = () => {
      const clock = $('#paperClock');
      if (!clock) { clearInterval(this.timer); return; }
      const left = Math.max(0, Math.ceil((attempt.start + this.duration - Date.now()) / 1000));
      clock.textContent = this.clock(left);
      if (!left) { this.handIn(attempt); this.view(paper.id); }
    };
    this.timer = setInterval(tick, 500);
    tick();
  },
  mark(paper, run, attempt) {
    main().innerHTML = `<header class="page-head"><div class="eyebrow">114 年台大原卷｜用時 ${this.clock(this.elapsed(attempt))}</div>
      <h1>${paper.name}</h1><p>${paper.rules}</p>
      <p>依參考解答或批改結果填入各題實得分。空白是待核分，0 是已核分。失分題可記原因並安排重練。</p>
      <div class="row wrap"><b id="paperScore" role="status"></b><button class="btn" id="paperPdf">開啟原卷 PDF</button><a class="btn" href="#papers">回模考總覽</a></div></header>
      ${this.referencesHtml(paper)}
      <section class="card"><div class="paper-marks">${paper.items.map(([id, max, chapter]) => `<div class="paper-mark" data-mark="${id}">
        <label>第 ${id} 題 <span class="muted">滿分 ${max}</span><input type="number" min="0" max="${max}" step="any" inputmode="decimal" value="${attempt.scores[id] ?? ''}" aria-label="第 ${id} 題實得分"></label>
        <div data-correction ${attempt.scores[id] == null || attempt.scores[id] >= max ? 'hidden' : ''}>
          ${this.correctionHtml(attempt, id, chapter)}</div></div>`).join('')}</div></section>`;
    $('#paperPdf').onclick = () => this.openPaper(paper);
    const paint = () => {
      const score = this.score(paper, attempt), left = paper.items.length - score.count;
      $('#paperScore').textContent = score.complete ? `${score.points} / 100` : `已核 ${score.points} 分，${left} 題待核`;
    };
    $$('[data-mark]').forEach(row => {
      const id = row.dataset.mark, input = $('input', row), correction = $('[data-correction]', row);
      input.oninput = () => {
        if (!input.validity.valid) { input.setAttribute('aria-invalid', 'true'); return; }
        input.removeAttribute('aria-invalid');
        if (input.value === '') delete attempt.scores[id];
        else attempt.scores[id] = input.valueAsNumber;
        (attempt.scoreUpdated || (attempt.scoreUpdated = {}))[id] = Date.now();
        correction.hidden = attempt.scores[id] == null || attempt.scores[id] >= +input.max;
        this.save();
        paint();
      };
      input.onblur = () => {
        if (input.getAttribute('aria-invalid') !== 'true') return;
        input.value = attempt.scores[id] ?? '';
        input.removeAttribute('aria-invalid');
        toast(`第 ${id} 題請輸入 0 到 ${input.max} 分`, 'bad');
      };
      this.wireCorrection(row, paper, run, attempt, id);
    });
    paint();
  },
  referencesHtml(paper) {
    const answers = PAPER_REFERENCES[paper.id];
    if (!answers) return '<p class="muted small">這科請先用你手邊的詳解或請人批改，再填入得分。</p>';
    return `<details class="card"><summary>站內參考解答（依原卷解題）</summary><p class="muted small">有歧義的題目附上採用的假設。可保留待核分。</p><ul class="paper-references">${paper.items.map(([id]) =>
      `<li><b>${id}.</b> ${answers[id] ? mdLine(answers[id]) : '待核對'}</li>`).join('')}</ul></details>`;
  },
  correctionHtml(attempt, id, topic) {
    const item = attempt.corrections[id] || {};
    const kp = KP.N[topic];
    const title = kp ? KP.shortT(topic) : LESSON[topic]?.title;
    const href = kp ? KP.href(topic) : '#' + topic;
    const canVerify = item.drilled && D.today() > item.drilled && !item.verified;
    return `<details ${item.cause || item.note ? 'open' : ''}><summary>訂正${title ? '｜' + esc(title) : ''}</summary>
      <label>失分原因<select data-loss><option value="">請選擇</option>${[...CAUSES, '時間不夠'].map(cause => `<option ${item.cause === cause ? 'selected' : ''}>${cause}</option>`).join('')}</select></label>
      <label>訂正筆記<textarea data-paper-note rows="2">${esc(item.note || '')}</textarea></label>
      ${title ? `<div class="row wrap"><a href="${href}">看教材</a><button class="btn sm" data-drill="${topic}">補練${kp ? '這個知識點' : '同章'}</button>
      ${canVerify ? `<button class="btn sm" data-verify="${topic}">用新題驗證</button>` : ''}</div>` : '<p class="muted small">請用原題解答訂正。題庫沒有對應的知識點。</p>'}
      ${item.drilled ? `<p class="muted small">${esc(item.drilled)} 完成補練${!canVerify && !item.verified ? '，隔天可用新題驗證' : ''}。</p>` : ''}
      ${item.verified ? `<p class="small">${esc(item.verified.date)} 新題答對 ${item.verified.correct} / ${item.verified.count}</p>` : ''}</details>`;
  },
  correctionQuestions(topic) {
    const needsPrevious = /^(?:同上|同前|同一組|用上題|接上題|沿用上題|承上|續上題|上一題|上題|如上題|以上一題)|(?:in|from|as) the previous (?:question|problem|example)|\b(?:previous question|above problem)\b/i;
    const node = KP.N[topic];
    return QBANK.all().filter(q => (node ? q.kp === topic && q.ch === node.ch : q.ch === topic)
      && q.src !== 'agent' && q.type !== 'essay' && !needsPrevious.test(String(q.stem).trim()));
  },
  dueCorrections() {
    this.load();
    const due = [];
    for (const run of this.data.runs) for (const paper of NTU_PAPERS) {
      const attempt = run.papers[paper.id];
      if (!attempt?.submitted) continue;
      for (const [id, max, topic] of paper.items) {
        if (attempt.scores[id] == null || attempt.scores[id] >= max || !(KP.N[topic] || LESSON[topic])) continue;
        const item = attempt.corrections[id] || {};
        if (item.verified?.correct === item.verified?.count && item.verified?.count >= 3) continue;
        const kind = !item.drilled || item.verified ? 'drill' : 'verify';
        if (kind === 'verify' && item.drilled >= D.today()) continue;
        due.push({ runId: run.id, paperId: paper.id, itemId: id, topic, kind });
      }
    }
    return due;
  },
  dailyTask(kind) {
    const due = this.dueCorrections().filter(item => item.kind === kind);
    return { icon: 'review', title: `${kind === 'verify' ? '原卷新題驗證' : '原卷補練'} ${due.length} 個失分點`,
      sub: '', why: due.length ? `${this.paper(due[0].paperId).name}，第 ${due[0].itemId} 題` : '',
      mins: 15, done: !due.length, act: () => { if (due.length) this.startCorrection(due[0], kind === 'verify'); } };
  },
  startCorrection(ctx, verification) {
    const qs = this.correctionQuestions(ctx.topic);
    const unseen = qs.filter(q => !S.st.answers[q.id]);
    if (verification && unseen.length < 3) { toast('剩不到 3 題未做過的獨立練習題，請回原卷訂正', 'bad'); return; }
    const pool = verification ? unseen : [...unseen, ...qs.filter(q => S.st.answers[q.id])];
    Practice.start(pool.map(q => q.id), { title: verification ? '考古訂正：新題驗證' : '考古訂正：補練', limit: 3, ramp: false,
      correction: { runId: ctx.runId, paperId: ctx.paperId, itemId: ctx.itemId, verification } });
  },
  wireCorrection(row, paper, run, attempt, id) {
    const data = () => attempt.corrections[id] || (attempt.corrections[id] = {});
    $('[data-loss]', row).onchange = event => { Object.assign(data(), { cause: event.target.value, updated: Date.now() }); this.save(); };
    $('[data-paper-note]', row).oninput = event => { Object.assign(data(), { note: event.target.value, updated: Date.now() }); this.save(); };
    const drill = $('[data-drill]', row), verify = $('[data-verify]', row);
    const launch = (topic, verification) => this.startCorrection({ runId: run.id, paperId: paper.id, itemId: id, topic }, verification);
    if (drill) drill.onclick = () => launch(drill.dataset.drill, false);
    if (verify) verify.onclick = () => launch(verify.dataset.verify, true);
  },
  recordCorrection(ctx, res) {
    this.load();
    const run = this.data.runs.find(row => row.id === ctx.runId), attempt = run?.papers[ctx.paperId];
    if (!attempt || res.length < 3) return;
    const item = attempt.corrections[ctx.itemId] || (attempt.corrections[ctx.itemId] = {});
    if (ctx.verification) item.verified = { date: D.today(), correct: res.filter(r => r.ok).length, count: res.length };
    else if (!item.drilled || item.verified) { item.drilled = D.today(); delete item.verified; }
    item.updated = Date.now();
    this.save();
  },
};
