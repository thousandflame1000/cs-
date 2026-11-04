"""獨立重算 content/quiz/warmup.txt 裡數字題的答案，跟檔案裡的 == 答案比對。用法：python3 tests/warmup_answers.py"""
import io, math, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
txt = io.open(os.path.join(ROOT, 'content', 'quiz', 'warmup.txt'), encoding='utf-8').read()
ans = {m.group(1): m.group(2).strip() for m in re.finditer(r'^@q (\S+) \|[^\n]*\n(?:(?!^@q ).*\n)*?== (.+)$', txt, re.M)}
def fifo(ref, k):
    fr, f = [], 0
    for p in ref:
        if p not in fr:
            f += 1
            if len(fr) == k: fr.pop(0)
            fr.append(p)
    return f
fib = lambda n: 1 if n <= 2 else fib(n - 1) + fib(n - 2)
expect = {
    'ds-w04': 0, 'ds-w05': 2 * 3, 'ds-w08': 5, 'ds-w09': 23 % 7, 'ds-w10': 20 / 10, 'ds-w13': 2, 'ds-w15': 4 * 2,
    'al-w04': math.floor(math.log2(8)) + 1, 'al-w05': fib(6), 'al-w10': min(9, 5 + 2), 'al-w11': 5 - 1, 'al-w15': 10 * .5,
    'co-w01': 100 * 2 * 1, 'co-w02': 1 / (1 - .5), 'co-w03': 0b1111 - 16, 'co-w07': 5 + 10 - 1, 'co-w08': 1,
    'co-w11': int(math.log2(16)), 'co-w12': 1 + .1 * 50,
    'os-w02': 2, 'os-w03': 3 + 2, 'os-w06': 1 - 1, 'os-w09': int(math.log2(4096)), 'os-w11': fifo([1, 2, 3, 4], 3),
    'dm-w02': math.ceil(13 / 12), 'dm-w03': math.comb(5, 2), 'dm-w04': math.factorial(3), 'dm-w05': 1 + 2 * 3,
    'dm-w06': 2 ** 3 - 1, 'dm-w08': 3, 'dm-w09': 6 - 1, 'dm-w10': math.comb(4, 2), 'dm-w11': math.gcd(12, 18), 'dm-w12': 17 % 5,
    'la-w02': (3 + 1) / 2, 'la-w03': 3, 'la-w05': 2 * 3 - 1 * 1, 'la-w08': 2 * 3, 'la-w09': 1 * 2 + 2 * (-1), 'la-w10': math.hypot(3, 4),
}
bad, miss = [], [k for k in ans if k not in expect]
for k, v in expect.items():
    a = ans.get(k)
    if a is None: bad.append((k, '檔案裡沒有 == 答案')); continue
    if abs(float(a.replace('−', '-')) - v) > 1e-9: bad.append((k, a, v))
print('數字題', len(expect), '｜不一致', bad, '｜沒驗到的填空題', miss)
