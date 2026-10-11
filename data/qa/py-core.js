(function () {
  var OR = (window.OR = window.OR || {}); OR.qa = OR.qa || [];
  OR.qa.push(
{
    "id": "py-reverse-string",
    "title": "Reverse a string in Python",
    "q": [
      "how to reverse a string in python",
      "reverse a string",
      "flip a string around",
      "reverse string python",
      "reverse text backwards"
    ],
    "tags": "reverse string slicing reversed join [::-1] backwards",
    "a": "Use slicing with a negative step: `s[::-1]`. Strings are immutable, so this builds a new string.",
    "code": {
      "py": "def rev(s):\n    return s[::-1]\n\nprint(rev(\"hello\"))              # olleh\nprint(\"\".join(reversed(\"hello\")))  # olleh"
    },
    "more": "Alternative: `\"\".join(reversed(s))`. Note `reversed(s)` alone returns an iterator, not a string.",
    "cx": "Time O(n), space O(n)",
    "see": [
      "#/cheatsheets/python",
      "#/topic/two-pointers"
    ],
    "check": "assert rev(\"hello\")==\"olleh\"\nassert rev(\"\")==\"\"\nassert rev(\"a\")==\"a\""
  },
  {
    "id": "py-reverse-words",
    "title": "Reverse the words in a sentence",
    "q": [
      "reverse words in a sentence",
      "reverse the order of words in a string",
      "python reverse words",
      "flip word order"
    ],
    "tags": "reverse words sentence split join whitespace",
    "a": "Split into words, reverse the list, join with a space: `\" \".join(s.split()[::-1])`. `split()` with no argument also collapses repeated spaces and trims ends.",
    "code": {
      "py": "def reverse_words(s):\n    return \" \".join(s.split()[::-1])\n\nprint(reverse_words(\"  the sky  is blue \"))  # blue is sky the"
    },
    "more": "To reverse each word but keep word order: `\" \".join(w[::-1] for w in s.split())`.",
    "cx": "Time O(n), space O(n)",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert reverse_words(\"  the sky  is blue \")==\"blue is sky the\"\nassert reverse_words(\"\")==\"\"\nassert reverse_words(\"one\")==\"one\""
  },
  {
    "id": "py-split-join",
    "title": "split and join strings",
    "q": [
      "how to split a string in python",
      "join a list of strings",
      "split string by comma",
      "python join list into string",
      "convert list of words to a sentence"
    ],
    "tags": "split join separator delimiter tokens string list",
    "a": "`s.split(sep)` returns a list of pieces; `sep.join(list)` glues strings back together. `split()` with no argument splits on any whitespace run.",
    "code": {
      "py": "parts = \"a,b,c\".split(\",\")\nprint(parts)                 # ['a', 'b', 'c']\nprint(\"-\".join(parts))       # a-b-c\nprint(\"a  b\\tc\".split())      # ['a', 'b', 'c']\nprint(\"a,b,c\".split(\",\", 1)) # ['a', 'b,c']"
    },
    "more": "- `join` needs strings: `\",\".join(map(str, nums))`.\n- `\"\".split(\",\")` gives `['']`, but `\"\".split()` gives `[]`.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert \"a,b,c\".split(\",\")==[\"a\",\"b\",\"c\"]\nassert \"-\".join([\"a\",\"b\"])==\"a-b\"\nassert \"\".split(\",\")==[\"\"]\nassert \"\".split()==[]"
  },
  {
    "id": "py-strip-trim",
    "title": "Trim whitespace from a string",
    "q": [
      "how to trim a string in python",
      "strip whitespace",
      "remove leading and trailing spaces",
      "strip vs lstrip rstrip",
      "remove newline from line"
    ],
    "tags": "strip lstrip rstrip trim whitespace newline",
    "a": "Use `s.strip()` to drop whitespace on both ends, `lstrip()` for the left, `rstrip()` for the right. Pass characters to strip those instead: `s.strip(\"xy\")`.",
    "code": {
      "py": "s = \"  hi there \\n\"\nprint(repr(s.strip()))    # 'hi there'\nprint(repr(s.lstrip()))   # 'hi there \\n'\nprint(\"xxabcxx\".strip(\"x\"))  # abc"
    },
    "more": "The argument is a set of characters, not a prefix: `\"abcba\".strip(\"ab\")` gives `\"c\"`. Use `removeprefix`/`removesuffix` (3.9+) for exact text.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert \"  hi \\n\".strip()==\"hi\"\nassert \" a \".lstrip()==\"a \"\nassert \"xxabcxx\".strip(\"x\")==\"abc\"\nassert \"\".strip()==\"\""
  },
  {
    "id": "py-upper-lower",
    "title": "Change string case",
    "q": [
      "how to make a string lowercase in python",
      "uppercase a string",
      "capitalize first letter",
      "swap case",
      "title case a string",
      "case insensitive compare"
    ],
    "tags": "upper lower title capitalize casefold swapcase case",
    "a": "Use `s.lower()`, `s.upper()`, `s.capitalize()` (first letter up, rest down), `s.title()` and `s.swapcase()`. For case-insensitive comparison, compare `a.lower() == b.lower()`.",
    "code": {
      "py": "s = \"Hello World\"\nprint(s.lower())       # hello world\nprint(s.upper())       # HELLO WORLD\nprint(\"hELLO\".capitalize())  # Hello\nprint(s.swapcase())    # hELLO wORLD"
    },
    "more": "Check one character with `c.isupper()`, `c.islower()`. `casefold()` is the aggressive form for non-English text.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert \"Hello World\".lower()==\"hello world\"\nassert \"hELLO\".capitalize()==\"Hello\"\nassert \"A\".lower()==\"a\"\nassert \"\".upper()==\"\""
  },
  {
    "id": "py-find-replace",
    "title": "Find and replace in a string",
    "q": [
      "how to replace a substring in python",
      "find substring index in string",
      "check if string contains substring",
      "str.find vs index",
      "count occurrences of substring"
    ],
    "tags": "find index replace in contains substring count rfind",
    "a": "Use `sub in s` to test containment, `s.find(sub)` for the first index (-1 if missing), `s.replace(old, new)` to substitute all matches, and `s.count(sub)` to count non-overlapping matches.",
    "code": {
      "py": "s = \"banana\"\nprint(\"nan\" in s)          # True\nprint(s.find(\"na\"))         # 2\nprint(s.find(\"x\"))          # -1\nprint(s.replace(\"a\", \"o\"))  # bonono\nprint(s.count(\"an\"))        # 2\nprint(s.rfind(\"na\"))        # 4"
    },
    "more": "- `s.index(sub)` is like `find` but raises `ValueError` when missing.\n- Strings are immutable: `replace` returns a new string.",
    "cx": "Time O(n*m) worst case for find",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert \"nan\" in \"banana\"\nassert \"banana\".find(\"na\")==2\nassert \"banana\".find(\"x\")==-1\nassert \"banana\".replace(\"a\",\"o\")==\"bonono\"\nassert \"aaa\".count(\"aa\")==1"
  },
  {
    "id": "py-fstring",
    "title": "Format strings with f-strings",
    "q": [
      "python f string",
      "how to format a string in python",
      "print variables in a string",
      "format number to 2 decimal places",
      "pad a number with zeros",
      "string formatting"
    ],
    "tags": "f-string format decimals padding zfill width align",
    "a": "Prefix the string with `f` and put expressions in braces: `f\"{name} is {age}\"`. Add a format spec after a colon, e.g. `{x:.2f}`, `{n:05d}`, `{s:>8}`.",
    "code": {
      "py": "name, x, n = \"Ann\", 3.14159, 42\nprint(f\"{name}: {x:.2f}\")   # Ann: 3.14\nprint(f\"{n:05d}\")           # 00042\nprint(f\"[{name:>6}]\")       # [   Ann]\nprint(f\"{n:,} {n:b}\")       # 42 101010\nprint(f\"{n=}\")              # n=42"
    },
    "more": "`>` right-aligns, `<` left-aligns, `^` centers. `str(n).zfill(5)` also pads with zeros. `{x!r}` uses repr.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert f\"{3.14159:.2f}\"==\"3.14\"\nassert f\"{42:05d}\"==\"00042\"\nassert f\"{1234567:,}\"==\"1,234,567\"\nassert f\"{5:b}\"==\"101\""
  },
  {
    "id": "py-palindrome",
    "title": "Check if a string is a palindrome",
    "q": [
      "how to check if a string is a palindrome",
      "palindrome check python",
      "is string same forwards and backwards",
      "valid palindrome ignoring punctuation"
    ],
    "tags": "palindrome two pointers reverse alnum isalnum",
    "a": "Compare the string with its reverse: `s == s[::-1]`. To ignore case and punctuation, first keep only alphanumerics and lowercase them.",
    "code": {
      "py": "def is_pal(s):\n    t = [c.lower() for c in s if c.isalnum()]\n    return t == t[::-1]\n\nprint(is_pal(\"A man, a plan, a canal: Panama\"))  # True\nprint(is_pal(\"race a car\"))                       # False"
    },
    "more": "For O(1) extra space use two pointers moving inward and skipping non-alphanumerics (LeetCode 125).",
    "cx": "Time O(n), space O(n)",
    "see": [
      "#/problem/125",
      "#/cheatsheets/python",
      "#/topic/two-pointers"
    ],
    "check": "assert is_pal(\"A man, a plan, a canal: Panama\")\nassert not is_pal(\"race a car\")\nassert is_pal(\"\")\nassert is_pal(\"a\")"
  },
  {
    "id": "py-anagram",
    "title": "Check if two strings are anagrams",
    "q": [
      "how to check if two strings are anagrams",
      "anagram check python",
      "are two words anagrams",
      "same letters different order",
      "valid anagram"
    ],
    "tags": "anagram sorted Counter frequency count letters",
    "a": "Two strings are anagrams if they have the same character counts. Use `Counter(a) == Counter(b)` (O(n)) or `sorted(a) == sorted(b)` (O(n log n)).",
    "code": {
      "py": "from collections import Counter\n\ndef is_anagram(a, b):\n    return Counter(a) == Counter(b)\n\nprint(is_anagram(\"listen\", \"silent\"))  # True\nprint(is_anagram(\"rat\", \"car\"))        # False"
    },
    "more": "To group many words into anagram classes, use `tuple(sorted(w))` as a dict key (LeetCode 49).",
    "cx": "Time O(n), space O(k) for k distinct chars",
    "see": [
      "#/problem/242",
      "#/problem/49",
      "#/cheatsheets/python",
      "#/topic/arrays-hashing"
    ],
    "check": "assert is_anagram(\"listen\",\"silent\")\nassert not is_anagram(\"rat\",\"car\")\nassert not is_anagram(\"a\",\"ab\")\nassert is_anagram(\"\",\"\")"
  },
  {
    "id": "py-count-chars",
    "title": "Count characters in a string",
    "q": [
      "how to count characters in a string",
      "character frequency python",
      "count letters in a word",
      "most common character in a string",
      "count occurrences of each character"
    ],
    "tags": "Counter frequency count characters dict most_common",
    "a": "Use `collections.Counter(s)` to get a char -> count mapping. `.most_common(k)` returns the top k pairs; `s.count(c)` counts a single character.",
    "code": {
      "py": "from collections import Counter\n\ncnt = Counter(\"mississippi\")\nprint(cnt)                 # Counter({'i': 4, 's': 4, 'p': 2, 'm': 1})\nprint(cnt[\"s\"], cnt[\"z\"])  # 4 0\nprint(cnt.most_common(1))  # [('i', 4)]"
    },
    "more": "For lowercase-only input a fixed array is faster: `cnt = [0]*26; cnt[ord(c)-97] += 1`. Missing keys in a `Counter` read as 0 without being inserted.",
    "cx": "Time O(n)",
    "see": [
      "#/cheatsheets/python",
      "#/topic/arrays-hashing"
    ],
    "check": "from collections import Counter\nc=Counter(\"mississippi\")\nassert c[\"s\"]==4 and c[\"z\"]==0\nassert c.most_common(1)[0][1]==4\nassert Counter(\"\")=={}"
  },
  {
    "id": "py-ord-chr",
    "title": "Convert between characters and numbers (ord, chr)",
    "q": [
      "ord and chr in python",
      "character to ascii number",
      "letter to index 0-25",
      "number to letter python",
      "shift a letter caesar cipher"
    ],
    "tags": "ord chr ascii unicode char code letter index caesar",
    "a": "`ord(c)` gives the integer code of a character and `chr(n)` turns a code back into a character. Letter index: `ord(c) - ord(\"a\")`.",
    "code": {
      "py": "print(ord(\"a\"), chr(98))        # 97 b\nidx = ord(\"d\") - ord(\"a\")\nprint(idx)                      # 3\nprint(chr(ord(\"a\") + 25))       # z\n\ndef shift(c, k):\n    return chr((ord(c) - 97 + k) % 26 + 97)\nprint(shift(\"z\", 1))            # a"
    },
    "more": "The modulo wraps around the alphabet and works with negative shifts because Python `%` is non-negative for a positive modulus.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert ord(\"a\")==97 and chr(98)==\"b\"\nassert shift(\"z\",1)==\"a\"\nassert shift(\"a\",-1)==\"z\"\nassert chr(ord(\"A\")+1)==\"B\""
  },
  {
    "id": "py-string-slicing",
    "title": "Slice a string or list",
    "q": [
      "python slicing explained",
      "how does [::-1] work",
      "get substring python",
      "last n characters of a string",
      "slice with step",
      "s[a:b] syntax"
    ],
    "tags": "slice slicing substring start stop step negative index",
    "a": "`s[start:stop:step]` takes items from `start` up to but not including `stop`. Omitted bounds default to the ends, negative indexes count from the back, and slices never raise IndexError.",
    "code": {
      "py": "s = \"abcdef\"\nprint(s[1:4])    # bcd\nprint(s[:2])     # ab\nprint(s[-2:])    # ef\nprint(s[::2])    # ace\nprint(s[::-1])   # fedcba\nprint(s[10:20])  # (empty string)"
    },
    "more": "A slice copies, so `s[a:b]` costs O(b-a). The same syntax works on lists and tuples.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "s=\"abcdef\"\nassert s[1:4]==\"bcd\"\nassert s[-2:]==\"ef\"\nassert s[::2]==\"ace\"\nassert s[10:20]==\"\"\nassert [1,2,3][::-1]==[3,2,1]"
  },
  {
    "id": "py-string-immutable",
    "title": "Why can't I change a character in a string?",
    "q": [
      "string object does not support item assignment",
      "modify a character in a string python",
      "strings are immutable",
      "change one letter in a string"
    ],
    "tags": "immutable string item assignment TypeError list of chars mutate",
    "a": "Python strings are immutable, so `s[0] = \"x\"` raises `TypeError`. Convert to a list, edit it, and join, or build a new string with slicing.",
    "code": {
      "py": "s = \"hello\"\nchars = list(s)\nchars[0] = \"j\"\nprint(\"\".join(chars))      # jello\nprint(\"j\" + s[1:])          # jello\ntry:\n    s[0] = \"j\"\nexcept TypeError as e:\n    print(\"immutable\")"
    },
    "more": "This matters for complexity: each concatenation or edit copies the string, O(n).",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert \"\".join(chars)==\"jello\" and \"j\"+s[1:]==\"jello\"\ntry:\n    s[0]=\"b\"; raise SystemExit(1)\nexcept TypeError: pass"
  },
  {
    "id": "py-build-string",
    "title": "Build a string efficiently in a loop",
    "q": [
      "string concatenation in a loop slow",
      "efficient way to build a string python",
      "join vs plus string",
      "append characters to string",
      "stringbuilder in python"
    ],
    "tags": "string builder join concatenation += loop performance list append",
    "a": "Append pieces to a list and call `\"\".join(parts)` once at the end. Repeated `s += c` can copy the whole string every time and be O(n^2) in the worst case.",
    "code": {
      "py": "parts = []\nfor i in range(5):\n    parts.append(str(i))\nresult = \"\".join(parts)\nprint(result)   # 01234\n\nprint(\"\".join(str(i) for i in range(5)))  # 01234"
    },
    "more": "CPython sometimes optimizes `+=` on a string with a single reference, but you should not rely on it. The list-then-join pattern is the portable idiom.",
    "cx": "Time O(n) total",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert result==\"01234\"\nassert \"\".join(str(i) for i in range(5))==\"01234\"\nassert \"\".join([])==\"\""
  },
  {
    "id": "py-int-division-negative",
    "title": "Integer division and modulo with negative numbers",
    "q": [
      "python floor division negative",
      "-7 // 2 in python",
      "python modulo negative number",
      "difference between / and //",
      "why is -1 % 5 equal to 4"
    ],
    "tags": "floor division modulo negative // % remainder truncate",
    "a": "`//` floors toward negative infinity and `%` takes the sign of the divisor, so `-7 // 2 == -4` and `-7 % 2 == 1`. They always satisfy `a == (a // b) * b + a % b`. Use `int(a / b)` to truncate toward zero like C or Java.",
    "code": {
      "py": "print(7 // 2, -7 // 2)       # 3 -4\nprint(7 % 3, -7 % 3)         # 1 2\nprint(int(-7 / 2))           # -3  (truncate)\nimport math\nprint(math.fmod(-7, 3))      # -1.0  (C-style remainder)"
    },
    "more": "Handy for circular indexes: `(i - 1) % n` is always in `0..n-1`, unlike in Java or C++. For huge ints avoid `int(a/b)` (float precision); use `-(-a // b)` for ceiling division.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert -7//2==-4 and -7%2==1\nassert 7//2==3\nassert all(a==(a//b)*b+a%b for a in range(-9,10) for b in (-4,-3,3,4))\nassert int(-7/2)==-3\nassert -1%5==4"
  },
  {
    "id": "py-divmod",
    "title": "Get quotient and remainder together (divmod)",
    "q": [
      "python divmod",
      "quotient and remainder in one step",
      "convert seconds to hours minutes",
      "ceiling division python"
    ],
    "tags": "divmod quotient remainder ceil division digits base conversion",
    "a": "`divmod(a, b)` returns `(a // b, a % b)` in one call. Use it for digit extraction, time conversion and base conversion. Ceiling division is `-(-a // b)`.",
    "code": {
      "py": "q, r = divmod(17, 5)\nprint(q, r)                  # 3 2\nh, rem = divmod(3725, 3600)\nm, s = divmod(rem, 60)\nprint(h, m, s)               # 1 2 5\nprint(-(-7 // 2))            # 4  (ceil)"
    },
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert divmod(17,5)==(3,2)\nassert divmod(-7,2)==(-4,1)\nassert -(-7//2)==4\nassert -(-8//2)==4"
  },
  {
    "id": "py-infinity",
    "title": "Represent infinity in Python",
    "q": [
      "python infinity",
      "float inf",
      "initialize min with a large number",
      "positive and negative infinity",
      "max int in python"
    ],
    "tags": "inf infinity float math.inf min max initial sentinel",
    "a": "Use `float(\"inf\")` or `math.inf` as a sentinel that is greater than every number, and `-math.inf` for the smallest. Python ints have no maximum, so there is no `INT_MAX`.",
    "code": {
      "py": "import math\nbest = math.inf\nfor x in [5, 3, 8]:\n    best = min(best, x)\nprint(best)               # 3\nprint(math.inf > 10**100) # True\nprint(-math.inf < 0)      # True"
    },
    "more": "Comparisons between `inf` and ints are fine. Avoid inf in integer arithmetic such as modulo, and note `inf - inf` is `nan`.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "import math\nassert math.inf>10**100\nassert min(math.inf,5)==5\nassert -math.inf<-10**100\nassert float(\"inf\")==math.inf"
  },
  {
    "id": "py-rounding",
    "title": "Round numbers in Python",
    "q": [
      "how to round a number in python",
      "round up to nearest integer",
      "floor and ceil python",
      "round half to even",
      "truncate a float"
    ],
    "tags": "round floor ceil trunc int rounding math banker",
    "a": "`round(x)` rounds to nearest with ties going to the even number (`round(2.5) == 2`). Use `math.floor` / `math.ceil` for down/up, and `int(x)` to truncate toward zero. `round(x, 2)` keeps 2 decimals.",
    "code": {
      "py": "import math\nprint(round(2.5), round(3.5), round(2.675, 2))  # 2 4 2.67\nprint(math.floor(-1.5), math.ceil(-1.5))   # -2 -1\nprint(int(-1.9))                           # -1"
    },
    "more": "`round(2.675, 2)` gives 2.67 because binary floats cannot store 2.675 exactly. For exact money math use `decimal.Decimal` or integer cents.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "import math\nassert round(2.5)==2 and round(3.5)==4\nassert math.floor(-1.5)==-2 and math.ceil(-1.5)==-1\nassert int(-1.9)==-1\nassert math.ceil(4)==4"
  },
  {
    "id": "py-big-ints",
    "title": "Handle very large integers",
    "q": [
      "python integer overflow",
      "big numbers in python",
      "does python have int overflow",
      "compute factorial of 100",
      "mod 10**9+7"
    ],
    "tags": "big integer overflow arbitrary precision mod 1e9+7 pow modular",
    "a": "Python ints are arbitrary precision, so they never overflow; the cost is that very large values make arithmetic slower. When a problem asks for the answer modulo `10**9 + 7`, apply `%` as you go, and use `pow(b, e, m)` for fast modular exponent.",
    "code": {
      "py": "MOD = 10**9 + 7\nprint(2**100)                 # 1267650600228229401496703205376\nprint(pow(2, 100, MOD))       # fast modular power\nf = 1\nfor i in range(1, 21):\n    f = f * i % MOD\nprint(f)"
    },
    "more": "Do not use float for large exact values: `10**18 + 1` as an int is exact, `1e18 + 1` is not. The modular inverse for prime m is `pow(a, m-2, m)` or `pow(a, -1, m)` (3.8+).",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "MOD=10**9+7\nassert 2**100==1267650600228229401496703205376\nassert pow(2,100,MOD)==(2**100)%MOD\nassert pow(3,0,MOD)==1\nassert f==(2432902008176640000%MOD)"
  },
  {
    "id": "py-int-str-convert",
    "title": "Convert between int and string",
    "q": [
      "convert string to int python",
      "int to string",
      "convert number to binary string",
      "parse digits of a number",
      "string to int with base"
    ],
    "tags": "int str convert parse base bin hex digits ValueError",
    "a": "Use `int(s)` to parse (optionally `int(s, base)`), `str(n)` to format, and `bin(n)`, `hex(n)`, or `f\"{n:b}\"` for other bases. Digits of a number: `[int(d) for d in str(n)]`.",
    "code": {
      "py": "print(int(\"42\") + 1)          # 43\nprint(int(\"ff\", 16))          # 255\nprint(str(7) + \"!\")           # 7!\nprint(bin(10), f\"{10:b}\")     # 0b1010 1010\nprint([int(d) for d in str(305)])  # [3, 0, 5]"
    },
    "more": "`int(\"3.5\")` raises `ValueError`; use `int(float(s))`. Very long digit strings are limited to 4300 digits by default in recent Python versions.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert int(\"42\")==42 and int(\"ff\",16)==255\nassert int(\"1010\",2)==10\nassert bin(10)==\"0b1010\" and f\"{10:b}\"==\"1010\"\nassert [int(d) for d in str(305)]==[3,0,5]\ntry:\n    int(\"a\"); raise SystemExit(1)\nexcept ValueError: pass"
  },
  {
    "id": "py-swap",
    "title": "Swap two variables",
    "q": [
      "how to swap two variables in python",
      "swap list elements",
      "swap without temp variable",
      "exchange two values"
    ],
    "tags": "swap tuple unpacking temp variable exchange elements",
    "a": "Use tuple assignment: `a, b = b, a`. The right side is evaluated first, so no temp is needed. It works for list elements too: `arr[i], arr[j] = arr[j], arr[i]`.",
    "code": {
      "py": "a, b = 1, 2\na, b = b, a\nprint(a, b)           # 2 1\n\narr = [10, 20, 30]\narr[0], arr[2] = arr[2], arr[0]\nprint(arr)            # [30, 20, 10]"
    },
    "more": "Targets are assigned left to right, so be careful when one target is used as an index in another.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert (a,b)==(2,1)\nassert arr==[30,20,10]"
  },
  {
    "id": "py-create-list",
    "title": "Create a list",
    "q": [
      "how to create a list in python",
      "create a list of zeros",
      "list of n elements",
      "initialize list with default value",
      "list of numbers 0 to n"
    ],
    "tags": "list create initialize zeros range repeat comprehension",
    "a": "Use a literal `[1, 2, 3]`, `[0] * n` for n copies of an immutable value, `list(range(n))` for 0..n-1, or a comprehension `[f(i) for i in range(n)]`.",
    "code": {
      "py": "zeros = [0] * 5\nnums = list(range(5))\nsq = [i * i for i in range(5)]\nprint(zeros, nums, sq)   # [0, 0, 0, 0, 0] [0, 1, 2, 3, 4] [0, 1, 4, 9, 16]\nempty = []\nprint(len(empty))        # 0"
    },
    "more": "`[0] * n` is safe for ints, strings and None, but not for lists (see the 2-D grid entry).",
    "cx": "Time O(n)",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert zeros==[0,0,0,0,0]\nassert nums==[0,1,2,3,4]\nassert sq[-1]==16\nassert [0]*0==[]"
  },
  {
    "id": "py-2d-grid",
    "title": "Create a 2-D grid (matrix) correctly",
    "q": [
      "how to create a 2d list in python",
      "matrix of zeros python",
      "why do all rows change at once",
      "create grid rows cols",
      "[[0]*n]*m bug"
    ],
    "tags": "2d grid matrix list of lists zeros rows columns aliasing bug",
    "a": "Build it with a comprehension: `grid = [[0] * cols for _ in range(rows)]`. Never use `[[0] * cols] * rows`, which repeats one row object, so changing one cell changes every row.",
    "code": {
      "py": "rows, cols = 3, 4\ngood = [[0] * cols for _ in range(rows)]\ngood[0][0] = 1\nprint(good[1][0])   # 0\n\nbad = [[0] * cols] * rows\nbad[0][0] = 1\nprint(bad[1][0])    # 1  (same row object!)"
    },
    "more": "Access with `grid[r][c]`. Transpose with `list(zip(*grid))` (tuples) or `[list(r) for r in zip(*grid)]`.",
    "cx": "Time O(rows*cols)",
    "see": [
      "#/cheatsheets/python",
      "#/topic/matrix"
    ],
    "check": "assert good[1][0]==0 and good[0][0]==1\nassert bad[1][0]==1\nassert len(good)==3 and len(good[0])==4\nassert len({id(r) for r in good})==3"
  },
  {
    "id": "py-copy-list",
    "title": "Copy a list (shallow vs deep copy)",
    "q": [
      "how to copy a list in python",
      "copy vs deepcopy",
      "why does my copy change the original",
      "clone a list",
      "copy nested list"
    ],
    "tags": "copy deepcopy shallow list slice [:] clone alias nested",
    "a": "Assignment `b = a` only creates a second name for the same list. Use `a[:]`, `a.copy()` or `list(a)` for a shallow copy, and `copy.deepcopy(a)` when the list holds other mutable objects such as lists.",
    "code": {
      "py": "import copy\na = [[1], [2]]\nalias = a\nshallow = a.copy()\ndeep = copy.deepcopy(a)\na[0].append(9)\nprint(alias[0])    # [1, 9]\nprint(shallow[0])  # [1, 9]  (inner list shared)\nprint(deep[0])     # [1]"
    },
    "more": "In backtracking, append `path[:]` or `list(path)`, not `path`, or every stored answer will be mutated later.",
    "cx": "Time O(n) shallow",
    "see": [
      "#/cheatsheets/python",
      "#/topic/backtracking"
    ],
    "check": "assert alias is a\nassert shallow is not a and shallow[0] is a[0]\nassert deep[0]==[1]\nb=[1,2];c=b[:];c.append(3)\nassert b==[1,2]"
  },
  {
    "id": "py-list-ops-cost",
    "title": "Cost of list operations",
    "q": [
      "time complexity of python list operations",
      "list append pop insert complexity",
      "is list.pop(0) slow",
      "python list big o",
      "list remove complexity"
    ],
    "tags": "list complexity append pop insert remove index in big o amortized",
    "a": "`append`, `pop()` (end), indexing and `len` are O(1) (append amortized). `pop(0)`, `insert(i, x)`, `remove(x)`, `x in list`, and `list.index(x)` are O(n). For queue-style removal from the front use `collections.deque`.",
    "code": {
      "py": "from collections import deque\nitems = [1, 2, 3]\nitems.append(4)      # O(1)\nitems.pop()          # O(1)\nitems.pop(0)         # O(n): shifts everything\nitems.insert(0, 9)   # O(n)\nq = deque(items)\nq.popleft()          # O(1)\nprint(items, list(q))"
    },
    "more": "- `del lst[i]` is O(n) too.\n- Slicing and `copy` are O(k).\n- `lst.sort()` is O(n log n).",
    "see": [
      "#/cheatsheets/python",
      "#/topic/big-o",
      "#/topic/queues"
    ],
    "check": "assert items==[9,2,3]\nassert list(q)==[2,3]"
  },
  {
    "id": "py-insert-remove-pop",
    "title": "Add and remove list elements",
    "q": [
      "python list append vs extend",
      "remove element from list",
      "delete item at index",
      "insert at position",
      "pop from list",
      "remove all occurrences"
    ],
    "tags": "append extend insert remove pop del clear list add delete",
    "a": "`append(x)` adds one item, `extend(it)` adds many, `insert(i, x)` inserts at an index, `pop(i)` removes and returns by index (default last), `remove(x)` deletes the first match, `del lst[i]` deletes by index.",
    "code": {
      "py": "a = [1, 2, 3]\na.append(4); a.extend([5, 6])\nprint(a)                 # [1, 2, 3, 4, 5, 6]\na.insert(1, 99)          # [1, 99, 2, 3, 4, 5, 6]\nprint(a.pop(), a.pop(0)) # 6 1\na.remove(99)\ndel a[0]\nprint(a)                 # [3, 4, 5]\nb = [1, 2, 1, 3]\nb = [x for x in b if x != 1]\nprint(b)                 # [2, 3]"
    },
    "more": "`append([5,6])` adds a nested list; `extend` flattens one level. `remove` raises `ValueError` if the value is missing, `pop` on an empty list raises `IndexError`.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert a==[3,4,5]\nassert b==[2,3]\ntry:\n    [].pop(); raise SystemExit(1)\nexcept IndexError: pass\ntry:\n    [1].remove(5); raise SystemExit(1)\nexcept ValueError: pass"
  },
  {
    "id": "py-reverse-list",
    "title": "Reverse a list",
    "q": [
      "how to reverse a list in python",
      "reverse list in place",
      "reversed vs reverse",
      "reverse an array"
    ],
    "tags": "reverse list reversed in place slicing array",
    "a": "`lst.reverse()` reverses in place and returns None. `lst[::-1]` and `list(reversed(lst))` return a new reversed list.",
    "code": {
      "py": "a = [1, 2, 3]\nprint(a[::-1])           # [3, 2, 1]\nprint(list(reversed(a))) # [3, 2, 1]\na.reverse()\nprint(a)                 # [3, 2, 1]\nprint([1, 2].reverse())  # None"
    },
    "more": "A common bug is writing `a = a.reverse()`, which sets `a` to None. Manual in-place version: two pointers swapping from the ends.",
    "cx": "Time O(n)",
    "see": [
      "#/cheatsheets/python",
      "#/topic/two-pointers"
    ],
    "check": "assert a==[3,2,1]\nassert [1,2].reverse() is None"
  },
  {
    "id": "py-rotate-list",
    "title": "Rotate a list by k",
    "q": [
      "how to rotate an array in python",
      "rotate list left",
      "rotate array right by k",
      "shift elements of a list",
      "cyclic shift list"
    ],
    "tags": "rotate array list k shift cyclic slicing deque modulo",
    "a": "Normalize `k %= n`, then slice: right rotation is `a[-k:] + a[:-k]`, left rotation is `a[k:] + a[:k]`. Guard `n == 0`. For repeated rotations `deque.rotate(k)` is handy.",
    "code": {
      "py": "def rotate_right(a, k):\n    if not a:\n        return a\n    k %= len(a)\n    return a[-k:] + a[:-k] if k else a[:]\n\nprint(rotate_right([1,2,3,4,5], 2))   # [4, 5, 1, 2, 3]\nfrom collections import deque\nd = deque([1,2,3,4,5]); d.rotate(2)\nprint(list(d))                        # [4, 5, 1, 2, 3]"
    },
    "more": "For O(1) extra space, reverse the whole array, then reverse the first k and the last n-k parts (LeetCode 189).",
    "cx": "Time O(n), space O(n)",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert rotate_right([1,2,3,4,5],2)==[4,5,1,2,3]\nassert rotate_right([1,2,3],3)==[1,2,3]\nassert rotate_right([],5)==[]\nassert rotate_right([1,2,3],-1)==[2,3,1]"
  },
  {
    "id": "py-flatten",
    "title": "Flatten a nested list",
    "q": [
      "how to flatten a list of lists",
      "flatten 2d list python",
      "flatten nested list recursively",
      "merge list of lists into one"
    ],
    "tags": "flatten nested list chain from_iterable comprehension recursion",
    "a": "For a list of lists use `list(itertools.chain.from_iterable(lol))` or `[x for row in lol for x in row]`. Arbitrary nesting needs recursion.",
    "code": {
      "py": "from itertools import chain\nlol = [[1, 2], [3], [4, 5]]\nprint(list(chain.from_iterable(lol)))   # [1, 2, 3, 4, 5]\nprint([x for row in lol for x in row])  # [1, 2, 3, 4, 5]\n\ndef flat(x):\n    if not isinstance(x, list):\n        return [x]\n    return [y for item in x for y in flat(item)]\nprint(flat([1, [2, [3, [4]]]]))         # [1, 2, 3, 4]"
    },
    "more": "`sum(lol, [])` also works but is O(n^2); avoid it on big inputs. The comprehension reads outer loop first, then inner.",
    "cx": "Time O(total elements)",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert flat([1,[2,[3,[4]]]])==[1,2,3,4]\nassert flat([])==[]\nassert list(chain.from_iterable([[1],[2,3]]))==[1,2,3]"
  },
  {
    "id": "py-dedupe",
    "title": "Remove duplicates from a list",
    "q": [
      "how to remove duplicates from a list in python",
      "unique elements of a list",
      "dedupe list keep order",
      "remove duplicate values",
      "list(set(x)) order"
    ],
    "tags": "duplicates unique dedupe set dict.fromkeys order preserve",
    "a": "Use `list(dict.fromkeys(items))` to remove duplicates and keep first-seen order. `list(set(items))` is shorter but the order is arbitrary. Items must be hashable.",
    "code": {
      "py": "items = [3, 1, 3, 2, 1]\nprint(list(dict.fromkeys(items)))   # [3, 1, 2]\nprint(sorted(set(items)))           # [1, 2, 3]\n\nseen, out = set(), []\nfor x in items:\n    if x not in seen:\n        seen.add(x); out.append(x)\nprint(out)                          # [3, 1, 2]"
    },
    "more": "Dicts keep insertion order since Python 3.7. Unhashable items such as lists must be converted to tuples first.",
    "cx": "Time O(n), space O(n)",
    "see": [
      "#/cheatsheets/python",
      "#/topic/arrays-hashing"
    ],
    "check": "assert list(dict.fromkeys(items))==[3,1,2]\nassert out==[3,1,2]\nassert sorted(set([3,1,3]))==[1,3]\nassert list(dict.fromkeys([]))==[]"
  },
  {
    "id": "py-find-index",
    "title": "Find the index of an element in a list",
    "q": [
      "how to find index of element in list python",
      "list.index",
      "check if item is in list",
      "find position of max element",
      "index of first match"
    ],
    "tags": "index find position in list search ValueError enumerate argmax",
    "a": "`lst.index(x)` returns the first index of x and raises `ValueError` if absent, so guard with `x in lst`. For a condition or an argmax use `next(...)` with `enumerate`, or `max(range(n), key=lst.__getitem__)`.",
    "code": {
      "py": "a = [5, 8, 8, 2]\nprint(a.index(8))                                  # 1\nprint(a.index(8, 2))                               # 2 (start search at 2)\nprint(next((i for i, v in enumerate(a) if v > 6), -1))  # 1\nprint(max(range(len(a)), key=a.__getitem__))       # 1 (index of max)\nprint(8 in a)                                      # True"
    },
    "more": "Search in an unsorted list is O(n). If you need many lookups, build a dict value -> index.",
    "cx": "Time O(n)",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert a.index(8)==1 and a.index(8,2)==2\nassert next((i for i,v in enumerate(a) if v>100),-1)==-1\nassert max(range(len(a)),key=a.__getitem__)==1\ntry:\n    a.index(7); raise SystemExit(1)\nexcept ValueError: pass"
  },
  {
    "id": "py-min-max-sum",
    "title": "min, max and sum of a list",
    "q": [
      "how to find max in a list python",
      "min and max of list",
      "sum of a list",
      "max with key",
      "largest k elements"
    ],
    "tags": "min max sum key default largest nlargest heapq",
    "a": "`min(a)`, `max(a)` and `sum(a)` are O(n). Use `key=` to compare by something else, `default=` for empty input, and `heapq.nlargest(k, a)` for the k largest.",
    "code": {
      "py": "import heapq\na = [4, 9, 1, 7]\nprint(min(a), max(a), sum(a))               # 1 9 21\nprint(max([\"aa\", \"b\", \"cccc\"], key=len))     # cccc\nprint(max([], default=0))                    # 0\nprint(heapq.nlargest(2, a))                  # [9, 7]\nprint(max(1, 5, 3))                          # 5"
    },
    "more": "`max([])` without `default` raises `ValueError`. Ties return the first maximal element.",
    "cx": "Time O(n)",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert (min(a),max(a),sum(a))==(1,9,21)\nassert max([\"aa\",\"b\",\"cccc\"],key=len)==\"cccc\"\nassert max([],default=0)==0\nassert heapq.nlargest(2,a)==[9,7]\ntry:\n    max([]); raise SystemExit(1)\nexcept ValueError: pass"
  },
  {
    "id": "py-zip",
    "title": "Use zip to loop over lists together",
    "q": [
      "python zip",
      "iterate two lists at the same time",
      "zip two lists into dict",
      "unzip a list of pairs",
      "transpose a matrix"
    ],
    "tags": "zip parallel iterate unpack transpose dict pairs zip_longest",
    "a": "`zip(a, b)` pairs items by position and stops at the shortest. Turn pairs into a dict with `dict(zip(keys, vals))`, and unzip or transpose with `zip(*pairs)`.",
    "code": {
      "py": "names, ages = [\"a\", \"b\"], [30, 25]\nfor n, g in zip(names, ages):\n    print(n, g)\nprint(dict(zip(names, ages)))        # {'a': 30, 'b': 25}\npairs = [(1, \"x\"), (2, \"y\")]\nnums, letters = zip(*pairs)\nprint(nums, letters)                 # (1, 2) ('x', 'y')\nprint(list(zip(*[[1, 2], [3, 4]])))  # [(1, 3), (2, 4)]"
    },
    "more": "Use `itertools.zip_longest` to pad the shorter input. In 3.10+ `zip(a, b, strict=True)` raises if lengths differ. Adjacent pairs: `zip(a, a[1:])`.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert dict(zip(names,ages))=={\"a\":30,\"b\":25}\nassert list(zip([1,2,3],\"ab\"))==[(1,\"a\"),(2,\"b\")]\nassert list(zip(*[[1,2],[3,4]]))==[(1,3),(2,4)]\nassert nums==(1,2)\nassert list(zip())==[]"
  },
  {
    "id": "py-enumerate",
    "title": "Loop with index using enumerate",
    "q": [
      "python enumerate",
      "loop with index and value",
      "for i in range(len) vs enumerate",
      "start enumerate at 1",
      "iterate list with index"
    ],
    "tags": "enumerate index value loop start range len",
    "a": "Use `for i, x in enumerate(items):` to get the index and the value together. Pass `start=1` to begin counting at 1. It is clearer and faster than `range(len(items))`.",
    "code": {
      "py": "fruits = [\"a\", \"b\", \"c\"]\nfor i, f in enumerate(fruits):\n    print(i, f)           # 0 a / 1 b / 2 c\nprint(list(enumerate(fruits, start=1)))  # [(1, 'a'), (2, 'b'), (3, 'c')]\nidx = {f: i for i, f in enumerate(fruits)}\nprint(idx)                # {'a': 0, 'b': 1, 'c': 2}"
    },
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert list(enumerate(\"ab\"))==[(0,\"a\"),(1,\"b\")]\nassert list(enumerate(\"ab\",start=1))[0]==(1,\"a\")\nassert idx[\"c\"]==2\nassert list(enumerate([]))==[]"
  },
  {
    "id": "py-unpacking",
    "title": "Unpack lists and tuples",
    "q": [
      "python unpacking",
      "star unpacking first and rest",
      "a, *b = list",
      "unpack function arguments",
      "destructuring assignment python"
    ],
    "tags": "unpack unpacking star splat destructure tuple assignment * **",
    "a": "Assign several names at once: `a, b = pair`. A starred name collects the rest: `first, *rest = items`. In a call, `f(*args)` spreads a list and `f(**d)` spreads a dict.",
    "code": {
      "py": "first, *rest = [1, 2, 3, 4]\nprint(first, rest)        # 1 [2, 3, 4]\n*init, last = [1, 2, 3]\nprint(init, last)         # [1, 2] 3\na, (b, c) = 1, (2, 3)\nprint(a, b, c)            # 1 2 3\nprint(max(*[3, 9, 4]))    # 9\nprint([*[1, 2], *[3]])    # [1, 2, 3]"
    },
    "more": "The number of non-starred targets must match or you get `ValueError`. The starred target is always a list.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert first==1 and rest==[2,3,4]\nassert init==[1,2] and last==3\nx,*y=[7]\nassert y==[]\nassert {**{\"a\":1},**{\"b\":2}}=={\"a\":1,\"b\":2}"
  },
  {
    "id": "py-list-vs-tuple",
    "title": "List vs tuple",
    "q": [
      "difference between list and tuple",
      "when to use a tuple",
      "are tuples immutable",
      "tuple vs list performance",
      "tuple as dictionary key"
    ],
    "tags": "list tuple immutable hashable difference dict key set",
    "a": "Use a list for a changeable sequence and a tuple for a fixed record. Tuples cannot be modified, and (if their items are hashable) they can be dict keys or set members; lists cannot.",
    "code": {
      "py": "point = (3, 4)\nvisited = {point}                # tuples are hashable\nprint((3, 4) in visited)         # True\ntry:\n    {[3, 4]}\nexcept TypeError:\n    print(\"list is unhashable\")\ntry:\n    point[0] = 9\nexcept TypeError:\n    print(\"tuple is immutable\")\nsingle = (5,)\nprint(type(single).__name__)     # tuple"
    },
    "more": "- A one-item tuple needs the trailing comma.\n- A tuple holding a list is still unhashable.\n- Tuples compare lexicographically, useful for heap entries and sort keys.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert (3,4) in visited\nassert type((5,)).__name__==\"tuple\" and type((5)).__name__==\"int\"\nd={(0,1):\"x\"};assert d[(0,1)]==\"x\"\nassert (1,2)<(1,3)"
  },
  {
    "id": "py-sort-list",
    "title": "Sort a list in Python",
    "q": [
      "how do i sort a list in python",
      "sorted vs list.sort",
      "sort ascending and descending",
      "order a list from smallest to largest",
      "sort in place"
    ],
    "tags": "sort sorted ascending descending reverse in place timsort order",
    "a": "`sorted(a)` returns a new sorted list; `a.sort()` sorts in place and returns None. Add `reverse=True` for descending order.",
    "code": {
      "py": "a = [3, 1, 2]\nprint(sorted(a))                 # [1, 2, 3]\nprint(sorted(a, reverse=True))   # [3, 2, 1]\nprint(a)                         # [3, 1, 2] unchanged\na.sort()\nprint(a)                         # [1, 2, 3]\nprint(sorted(\"bca\"))             # ['a', 'b', 'c']"
    },
    "more": "`sorted` works on strings, tuples, sets and dict keys, always returning a list. Mixed types such as int and str raise `TypeError`.",
    "cx": "Time O(n log n)",
    "see": [
      "#/cheatsheets/python",
      "#/topic/sorting"
    ],
    "check": "assert a==[1,2,3]\nassert sorted([3,1,2],reverse=True)==[3,2,1]\nassert [3,1].sort() is None\nassert sorted([])==[]"
  },
  {
    "id": "py-sort-key",
    "title": "Sort by a key function",
    "q": [
      "sort a list by a key",
      "sort list of tuples by second element",
      "sort list of dictionaries by value",
      "sort strings by length",
      "python sort with lambda"
    ],
    "tags": "sort key lambda tuple dict length itemgetter custom",
    "a": "Pass `key=` a function that maps each item to the value to compare. Examples: `key=len`, `key=lambda t: t[1]`, `key=lambda d: d[\"age\"]`. `reverse=True` flips the order.",
    "code": {
      "py": "words = [\"pear\", \"fig\", \"banana\"]\nprint(sorted(words, key=len))                    # ['fig', 'pear', 'banana']\npairs = [(1, \"b\"), (2, \"a\")]\nprint(sorted(pairs, key=lambda t: t[1]))         # [(2, 'a'), (1, 'b')]\npeople = [{\"n\": \"x\", \"age\": 30}, {\"n\": \"y\", \"age\": 20}]\nprint([p[\"n\"] for p in sorted(people, key=lambda p: p[\"age\"])])  # ['y', 'x']\nprint(sorted(words, key=str.lower, reverse=True))"
    },
    "more": "The key function runs once per item, so it is cheap. `operator.itemgetter(1)` is an alternative to the lambda.",
    "cx": "Time O(n log n)",
    "see": [
      "#/cheatsheets/python",
      "#/topic/sorting"
    ],
    "check": "assert sorted(words,key=len)==[\"fig\",\"pear\",\"banana\"]\nassert sorted(pairs,key=lambda t:t[1])[0]==(2,\"a\")\nassert [p[\"n\"] for p in sorted(people,key=lambda p:p[\"age\"])]==[\"y\",\"x\"]"
  },
  {
    "id": "py-sort-multi-key",
    "title": "Sort by multiple keys",
    "q": [
      "sort by two fields python",
      "sort by length then alphabetically",
      "sort descending by one key and ascending by another",
      "multi key sort tuple",
      "sort by count then by name"
    ],
    "tags": "sort multiple keys tuple secondary descending negative ties",
    "a": "Return a tuple from `key`: items sort by the first element, then the second on ties. To mix directions, negate numeric parts: `key=lambda w: (-count[w], w)`.",
    "code": {
      "py": "from collections import Counter\nwords = [\"b\", \"a\", \"c\", \"a\", \"b\", \"a\"]\ncount = Counter(words)\nuniq = sorted(count, key=lambda w: (-count[w], w))\nprint(uniq)    # ['a', 'b', 'c']\nprint(sorted([\"bb\", \"a\", \"cc\", \"d\"], key=lambda w: (len(w), w)))  # ['a', 'd', 'bb', 'cc']"
    },
    "more": "You cannot negate strings; for descending strings sort twice (stable sort) with the less important key first, or use `reverse=True` on the pass that needs it.",
    "see": [
      "#/cheatsheets/python",
      "#/topic/sorting"
    ],
    "check": "assert uniq==[\"a\",\"b\",\"c\"]\nassert sorted([\"bb\",\"a\",\"cc\",\"d\"],key=lambda w:(len(w),w))==[\"a\",\"d\",\"bb\",\"cc\"]\nassert sorted([(1,\"b\"),(1,\"a\"),(0,\"z\")],key=lambda t:(-t[0],t[1]))==[(1,\"a\"),(1,\"b\"),(0,\"z\")]"
  },
  {
    "id": "py-stable-sort",
    "title": "Is Python's sort stable?",
    "q": [
      "is python sort stable",
      "stable sorting meaning",
      "sort twice by two keys",
      "what algorithm does python sort use",
      "timsort"
    ],
    "tags": "stable sort timsort equal elements order preserved",
    "a": "Yes. `sorted` and `list.sort` are stable: items with equal keys keep their original relative order. The algorithm is Timsort, O(n log n) worst case and O(n) on already sorted data.",
    "code": {
      "py": "rows = [(\"b\", 1), (\"a\", 1), (\"c\", 0)]\nprint(sorted(rows, key=lambda r: r[1]))   # [('c', 0), ('b', 1), ('a', 1)]\n# multi-pass: sort by name first, then by number\nrows.sort(key=lambda r: r[0])\nrows.sort(key=lambda r: r[1])\nprint(rows)   # [('c', 0), ('a', 1), ('b', 1)]"
    },
    "more": "Stability is what makes the \"sort by secondary key first, primary key last\" trick work. `reverse=True` also preserves the original order of equal items.",
    "cx": "Time O(n log n)",
    "see": [
      "#/cheatsheets/python",
      "#/topic/sorting"
    ],
    "check": "assert rows==[(\"c\",0),(\"a\",1),(\"b\",1)]\nassert sorted([(\"b\",1),(\"a\",1)],key=lambda r:r[1])==[(\"b\",1),(\"a\",1)]\nassert sorted([])==[]"
  },
  {
    "id": "py-dict-iterate",
    "title": "Loop over a dictionary",
    "q": [
      "how to iterate over a dictionary in python",
      "loop through dict keys and values",
      "dict.items",
      "for key value in dict",
      "iterate dict sorted by key"
    ],
    "tags": "dict iterate items keys values loop for key value sorted",
    "a": "Loop with `for k, v in d.items()`. Use `d.keys()` or just `for k in d` for keys, and `d.values()` for values. Insertion order is preserved.",
    "code": {
      "py": "d = {\"a\": 1, \"b\": 2}\nfor k, v in d.items():\n    print(k, v)            # a 1 / b 2\nprint(list(d), list(d.values()))   # ['a', 'b'] [1, 2]\nfor k in sorted(d):\n    print(k)\nprint(sum(d.values()))     # 3"
    },
    "more": "Do not add or delete keys while looping over the dict (see the delete-while-iterating entry).",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert list(d.items())==[(\"a\",1),(\"b\",2)]\nassert sum(d.values())==3\nassert sorted(d)==[\"a\",\"b\"]\nassert list({}.items())==[]"
  },
  {
    "id": "py-dict-get",
    "title": "Get a dict value with a default",
    "q": [
      "dict get default python",
      "avoid KeyError dictionary",
      "check if key in dict",
      "d.get vs d[key]",
      "safe dictionary lookup"
    ],
    "tags": "dict get default KeyError in membership lookup",
    "a": "`d.get(key, default)` returns the default instead of raising `KeyError`. Check presence with `key in d`. `d[key]` raises if missing.",
    "code": {
      "py": "d = {\"a\": 1}\nprint(d.get(\"a\", 0))   # 1\nprint(d.get(\"z\", 0))   # 0\nprint(\"a\" in d)        # True\nd[\"c\"] = d.get(\"c\", 0) + 1\nprint(d)               # {'a': 1, 'c': 1}\ntry:\n    d[\"zz\"]\nexcept KeyError:\n    print(\"missing\")"
    },
    "more": "`d.get(k)` returns `None` when missing; `None` is falsy, so `if d.get(k):` also skips stored 0 values. Prefer `if k in d`.",
    "cx": "Time O(1) average",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert d=={\"a\":1,\"c\":1}\nassert d.get(\"z\") is None\nassert d.get(\"z\",5)==5\ntry:\n    d[\"z\"]; raise SystemExit(1)\nexcept KeyError: pass"
  },
  {
    "id": "py-dict-setdefault",
    "title": "setdefault and defaultdict",
    "q": [
      "dict setdefault",
      "python defaultdict",
      "group items into a dict of lists",
      "append to list in dict without checking",
      "default value for missing dict key"
    ],
    "tags": "defaultdict setdefault dict list group append missing key factory",
    "a": "Use `collections.defaultdict(list)` so missing keys start as an empty list. `d.setdefault(k, []).append(x)` does the same on a normal dict.",
    "code": {
      "py": "from collections import defaultdict\ng = defaultdict(list)\nfor w in [\"ant\", \"bee\", \"ape\"]:\n    g[w[0]].append(w)\nprint(dict(g))     # {'a': ['ant', 'ape'], 'b': ['bee']}\n\nd = {}\nd.setdefault(\"x\", []).append(1)\nprint(d)           # {'x': [1]}\nc = defaultdict(int); c[\"q\"] += 1\nprint(c[\"q\"], c[\"none\"])   # 1 0"
    },
    "more": "Reading a missing key from a `defaultdict` creates it. Use `d.get(k)` or `k in d` if you do not want that. Wrap in `dict(g)` when printing or returning.",
    "see": [
      "#/cheatsheets/python",
      "#/topic/arrays-hashing"
    ],
    "check": "assert dict(g)=={\"a\":[\"ant\",\"ape\"],\"b\":[\"bee\"]}\nassert d=={\"x\":[1]}\nassert c[\"q\"]==1 and c[\"none\"]==0 and \"none\" in c"
  },
  {
    "id": "py-merge-dicts",
    "title": "Merge two dictionaries",
    "q": [
      "how to merge dictionaries in python",
      "combine two dicts",
      "update dict with another dict",
      "dict union operator",
      "merge dicts and sum values"
    ],
    "tags": "merge dict update union combine ** unpack Counter add",
    "a": "Use `{**a, **b}` or `a | b` (3.9+); keys in `b` win. `a.update(b)` merges in place. To add values for shared keys use `Counter(a) + Counter(b)`.",
    "code": {
      "py": "from collections import Counter\na, b = {\"x\": 1, \"y\": 2}, {\"y\": 3, \"z\": 4}\nprint({**a, **b})      # {'x': 1, 'y': 3, 'z': 4}\nprint(a | b)           # same\nprint(Counter(a) + Counter(b))   # Counter({'y': 5, 'z': 4, 'x': 1})\na.update(b)\nprint(a)               # {'x': 1, 'y': 3, 'z': 4}"
    },
    "more": "`Counter + Counter` drops zero and negative counts.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert a=={\"x\":1,\"y\":3,\"z\":4}\nassert (a|b)[\"y\"]==3\nassert (Counter({\"y\":2})+Counter(b))[\"y\"]==5\nassert {**{}, **{}}=={}"
  },
  {
    "id": "py-invert-dict",
    "title": "Invert a dictionary (swap keys and values)",
    "q": [
      "how to invert a dictionary python",
      "swap keys and values in a dict",
      "reverse mapping dict",
      "value to key lookup"
    ],
    "tags": "invert reverse dict swap keys values mapping comprehension",
    "a": "Use a comprehension: `{v: k for k, v in d.items()}`. This requires values to be hashable and unique; with duplicates, later keys overwrite earlier ones, so group into lists if needed.",
    "code": {
      "py": "d = {\"a\": 1, \"b\": 2}\nprint({v: k for k, v in d.items()})   # {1: 'a', 2: 'b'}\n\nfrom collections import defaultdict\ndup = {\"a\": 1, \"b\": 1, \"c\": 2}\ninv = defaultdict(list)\nfor k, v in dup.items():\n    inv[v].append(k)\nprint(dict(inv))   # {1: ['a', 'b'], 2: ['c']}"
    },
    "more": "Common use: map a value back to its index with `{x: i for i, x in enumerate(a)}`.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert {v:k for k,v in d.items()}=={1:\"a\",2:\"b\"}\nassert dict(inv)=={1:[\"a\",\"b\"],2:[\"c\"]}\nassert {v:k for k,v in {}.items()}=={}"
  },
  {
    "id": "py-sort-dict-by-value",
    "title": "Sort a dictionary by value",
    "q": [
      "sort dict by value python",
      "sort dictionary by key",
      "dict items sorted descending",
      "top k most frequent from dict",
      "order dict by values"
    ],
    "tags": "sort dict value items sorted key lambda most common descending",
    "a": "Sort the items: `sorted(d.items(), key=lambda kv: kv[1])`. Add `reverse=True` for descending, and wrap in `dict(...)` to rebuild an ordered dict. Sort by key with `sorted(d.items())`.",
    "code": {
      "py": "d = {\"a\": 3, \"b\": 1, \"c\": 2}\nbyval = sorted(d.items(), key=lambda kv: kv[1])\nprint(byval)                               # [('b', 1), ('c', 2), ('a', 3)]\nprint(dict(sorted(d.items(), key=lambda kv: -kv[1])))   # {'a': 3, 'c': 2, 'b': 1}\nprint(sorted(d, key=d.get)[0])             # b  (key with smallest value)\nprint(max(d, key=d.get))                   # a"
    },
    "more": "A dict itself has no sort order other than insertion order; sorting returns a list of pairs or a rebuilt dict.",
    "cx": "Time O(n log n)",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert byval[0]==(\"b\",1)\nassert list(dict(sorted(d.items(),key=lambda kv:-kv[1])))==[\"a\",\"c\",\"b\"]\nassert max(d,key=d.get)==\"a\"\nassert sorted(d.items())[0]==(\"a\",3)"
  },
  {
    "id": "py-delete-while-iterating",
    "title": "Delete from a dict or list while iterating",
    "q": [
      "dictionary changed size during iteration",
      "remove items from list while looping",
      "delete keys while looping through dict",
      "RuntimeError dict changed",
      "filter a list in place"
    ],
    "tags": "delete remove iterate loop modify RuntimeError dictionary changed size list comprehension copy",
    "a": "Do not change the size of a dict you are looping over: it raises `RuntimeError`. Loop over a copy (`list(d)`) or build a new dict/list with a comprehension. For lists, removing during iteration silently skips items.",
    "code": {
      "py": "d = {\"a\": 1, \"b\": 2, \"c\": 3}\nfor k in list(d):             # iterate a snapshot\n    if d[k] % 2:\n        del d[k]\nprint(d)                      # {'b': 2}\n\nnums = [1, 2, 3, 4]\nnums = [x for x in nums if x % 2 == 0]\nprint(nums)                   # [2, 4]\nnums[:] = [x for x in nums if x > 2]   # in place\nprint(nums)                   # [4]"
    },
    "more": "Changing a value of an existing key during iteration is allowed; adding or deleting keys is not.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert d=={\"b\":2}\nassert nums==[4]\nbad=[1,1,2]\nfor x in bad:\n    if x==1: bad.remove(x)\nassert bad==[1,2]"
  },
  {
    "id": "py-count-group",
    "title": "Count and group items with a dict",
    "q": [
      "count frequency of elements in list",
      "python counter",
      "group by key python",
      "frequency map",
      "count occurrences of each element"
    ],
    "tags": "count frequency Counter group groupby dict hash map occurrences",
    "a": "Use `Counter(items)` for counts. To group, use `defaultdict(list)`. `itertools.groupby` only groups adjacent equal keys, so sort first.",
    "code": {
      "py": "from collections import Counter, defaultdict\nitems = [\"a\", \"b\", \"a\", \"c\", \"a\"]\nprint(Counter(items))            # Counter({'a': 3, 'b': 1, 'c': 1})\n\ngroups = defaultdict(list)\nfor w in [\"tea\", \"eat\", \"bat\", \"ate\"]:\n    groups[\"\".join(sorted(w))].append(w)\nprint(list(groups.values()))     # [['tea', 'eat', 'ate'], ['bat']]\nmanual = {}\nfor x in items:\n    manual[x] = manual.get(x, 0) + 1\nprint(manual)"
    },
    "more": "Counter supports `most_common(k)`, `+`, `-`, and `update(iterable)`.",
    "cx": "Time O(n)",
    "see": [
      "#/cheatsheets/python",
      "#/topic/arrays-hashing"
    ],
    "check": "assert Counter(items)[\"a\"]==3\nassert list(groups.values())==[[\"tea\",\"eat\",\"ate\"],[\"bat\"]]\nassert manual==dict(Counter(items))\nassert Counter()=={}"
  },
  {
    "id": "py-set-ops",
    "title": "Set operations: union, intersection, difference",
    "q": [
      "python set operations",
      "union of two sets",
      "intersection of two lists",
      "difference between two sets",
      "symmetric difference",
      "find common elements"
    ],
    "tags": "set union intersection difference symmetric subset | & - ^ common",
    "a": "Use `a | b` (union), `a & b` (intersection), `a - b` (in a not b), `a ^ b` (in exactly one), and `a <= b` (subset). Convert lists with `set(lst)` first.",
    "code": {
      "py": "a, b = {1, 2, 3}, {2, 3, 4}\nprint(a | b)    # {1, 2, 3, 4}\nprint(a & b)    # {2, 3}\nprint(a - b)    # {1}\nprint(a ^ b)    # {1, 4}\nprint({2} <= a) # True\nprint(sorted(set([1, 2, 2]) & set([2, 5])))  # [2]"
    },
    "more": "`{}` is an empty dict; make an empty set with `set()`. Sets are unordered, so sort before printing for stable output.",
    "cx": "Union/intersection O(len(a)+len(b))",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert a|b=={1,2,3,4} and a&b=={2,3}\nassert a-b=={1} and a^b=={1,4}\nassert {2}<=a\nassert set()==set([])"
  },
  {
    "id": "py-set-membership",
    "title": "Why is set membership faster than list?",
    "q": [
      "in operator list vs set",
      "set lookup time complexity",
      "speed up x in list",
      "contains check python performance",
      "use set for lookup"
    ],
    "tags": "set membership in lookup O(1) hash list O(n) speed contains",
    "a": "`x in set` is O(1) on average because it hashes the value; `x in list` scans in O(n). If you test membership repeatedly, convert the list to a set once.",
    "code": {
      "py": "big = list(range(100000))\nlookup = set(big)\nprint(99999 in big)      # O(n) scan\nprint(99999 in lookup)   # O(1) average\nseen = set()\nfor x in [1, 2, 1]:\n    if x in seen:\n        print(\"dup\", x)   # dup 1\n    seen.add(x)"
    },
    "more": "Worst case a set operation degrades to O(n) with many hash collisions, which is rare. Set items must be hashable (no lists or dicts).",
    "cx": "Average O(1), worst O(n)",
    "see": [
      "#/cheatsheets/python",
      "#/topic/hashing-internals",
      "#/topic/arrays-hashing"
    ],
    "check": "assert (99999 in big) and (99999 in lookup)\nassert -1 not in lookup\nassert seen=={1,2}"
  },
  {
    "id": "py-comprehensions",
    "title": "List, dict and set comprehensions",
    "q": [
      "python list comprehension",
      "list comprehension with if else",
      "dict comprehension",
      "nested list comprehension",
      "set comprehension"
    ],
    "tags": "comprehension list dict set generator if else nested filter map",
    "a": "A comprehension builds a collection in one expression: `[expr for x in it if cond]`. Use `{k: v for ...}` for dicts and `{x for ...}` for sets. An if-else goes before the `for`: `[a if c else b for x in it]`.",
    "code": {
      "py": "nums = [1, 2, 3, 4]\nprint([x * x for x in nums if x % 2 == 0])        # [4, 16]\nprint([\"even\" if x % 2 == 0 else \"odd\" for x in nums])\nprint({x: x * x for x in nums})                    # {1: 1, 2: 4, 3: 9, 4: 16}\nprint({x % 2 for x in nums})                       # {0, 1}\nprint([[i * j for j in range(3)] for i in range(2)])  # [[0, 0, 0], [0, 1, 2]]\nprint(sum(x for x in nums))                        # 10 (generator)"
    },
    "more": "A filter-only `if` goes after the loop; the ternary form goes before it. Parentheses create a generator, which is lazy and uses O(1) memory.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert [x*x for x in nums if x%2==0]==[4,16]\nassert [\"e\" if x%2==0 else \"o\" for x in nums]==[\"o\",\"e\",\"o\",\"e\"]\nassert {x:x*x for x in nums}[3]==9\nassert [[i*j for j in range(3)] for i in range(2)]==[[0,0,0],[0,1,2]]"
  },
  {
    "id": "py-range-loops",
    "title": "Loops with range, while and break",
    "q": [
      "python for loop range",
      "loop backwards in python",
      "range with step",
      "while loop python",
      "break and continue",
      "for else"
    ],
    "tags": "range loop for while break continue step backwards reverse else",
    "a": "`range(stop)`, `range(start, stop)` and `range(start, stop, step)` exclude the stop value. Count backwards with `range(n - 1, -1, -1)` or `reversed(range(n))`. Use `while cond:` when the number of steps is not known.",
    "code": {
      "py": "print(list(range(3)))             # [0, 1, 2]\nprint(list(range(2, 10, 3)))      # [2, 5, 8]\nprint(list(range(4, -1, -2)))     # [4, 2, 0]\nprint(list(reversed(range(3))))   # [2, 1, 0]\nn = 27; steps = 0\nwhile n != 1:\n    n = n // 2 if n % 2 == 0 else 3 * n + 1\n    steps += 1\nprint(steps)                      # 111\nfor i in range(3):\n    if i == 5: break\nelse:\n    print(\"no break\")"
    },
    "more": "The loop `else` runs only when the loop finished without `break`. `range` is lazy and O(1) in memory.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert list(range(3))==[0,1,2]\nassert list(range(2,10,3))==[2,5,8]\nassert list(range(4,-1,-2))==[4,2,0]\nassert list(range(0))==[]\nassert steps==111"
  },
  {
    "id": "py-default-arg-gotcha",
    "title": "Mutable default argument bug",
    "q": [
      "python default argument list bug",
      "function remembers previous call list",
      "mutable default parameter",
      "why does my default list keep growing",
      "def f(x, a=[])"
    ],
    "tags": "default argument mutable list gotcha None sentinel function bug",
    "a": "Default values are evaluated once, when the function is defined, so a default `[]` is shared between calls. Use `None` as the default and create the list inside the function.",
    "code": {
      "py": "def bad(x, acc=[]):\n    acc.append(x)\n    return acc\n\ndef good(x, acc=None):\n    if acc is None:\n        acc = []\n    acc.append(x)\n    return acc\n\nprint(bad(1), bad(2))     # [1, 2] [1, 2]\nprint(good(1), good(2))   # [1] [2]"
    },
    "more": "Immutable defaults (numbers, strings, tuples, None) are safe. Same trap with `{}` and `set()`.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert bad.__defaults__==([1,2],)\nassert good(1)==[1] and good(2)==[2]\nassert good(3,[0])==[0,3]"
  },
  {
    "id": "py-args-kwargs",
    "title": "*args and **kwargs",
    "q": [
      "what is *args and **kwargs",
      "variable number of arguments python",
      "pass dict as keyword arguments",
      "keyword only arguments",
      "python function arbitrary arguments"
    ],
    "tags": "args kwargs variadic star double star keyword arguments unpack function",
    "a": "`*args` collects extra positional arguments into a tuple and `**kwargs` collects extra keyword arguments into a dict. At a call site `f(*lst)` and `f(**d)` spread them back out.",
    "code": {
      "py": "def show(a, *args, **kwargs):\n    return a, args, kwargs\n\nprint(show(1, 2, 3, x=4))     # (1, (2, 3), {'x': 4})\nnums = [1, 2]\nopts = {\"x\": 9}\nprint(show(*nums, **opts))    # (1, (2,), {'x': 9})\n\ndef f(a, *, key=None):        # key is keyword-only\n    return a, key\nprint(f(1, key=2))"
    },
    "more": "Parameter order: positional, `*args`, keyword-only, `**kwargs`.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert show(1,2,3,x=4)==(1,(2,3),{\"x\":4})\nassert show(*[1,2],**{\"x\":9})==(1,(2,),{\"x\":9})\nassert show(0)==(0,(),{})\nassert f(1,key=2)==(1,2)"
  },
  {
    "id": "py-lambda",
    "title": "Lambda functions",
    "q": [
      "python lambda",
      "anonymous function python",
      "lambda with sort key",
      "lambda if else",
      "map filter lambda"
    ],
    "tags": "lambda anonymous function map filter sorted key inline",
    "a": "`lambda args: expression` creates a small unnamed function that returns the expression. Use it for short callbacks like `key=lambda x: x[1]`; use `def` for anything longer.",
    "code": {
      "py": "sq = lambda x: x * x\nprint(sq(4))                                  # 16\nprint(list(map(lambda x: x + 1, [1, 2])))     # [2, 3]\nprint(list(filter(lambda x: x > 1, [1, 2, 3])))  # [2, 3]\nprint(sorted([(1, \"b\"), (2, \"a\")], key=lambda t: t[1]))\nsign = lambda x: \"pos\" if x > 0 else \"non-pos\"\nprint(sign(3))"
    },
    "more": "A lambda holds one expression only (no statements). Prefer a comprehension over `map`/`filter` with lambda for readability.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert sq(4)==16\nassert list(map(lambda x:x+1,[1,2]))==[2,3]\nassert sign(0)==\"non-pos\""
  },
  {
    "id": "py-closures",
    "title": "Closures and late binding",
    "q": [
      "python closure",
      "function returning a function",
      "lambda in loop gives same value",
      "nested function access outer variable",
      "late binding closures"
    ],
    "tags": "closure nested function factory late binding lambda loop default argument",
    "a": "A closure is an inner function that remembers variables from the enclosing function. Closures look up the variable when called, not when defined, so lambdas created in a loop all see the last value unless you bind it with a default argument.",
    "code": {
      "py": "def make_adder(n):\n    def add(x):\n        return x + n\n    return add\n\nadd5 = make_adder(5)\nprint(add5(2))                  # 7\nfs = [lambda: i for i in range(3)]\nprint([f() for f in fs])        # [2, 2, 2]\ngs = [lambda i=i: i for i in range(3)]\nprint([g() for g in gs])        # [0, 1, 2]"
    },
    "more": "To rebind an outer variable from the inner function, declare it `nonlocal`.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert add5(2)==7\nassert [f() for f in fs]==[2,2,2]\nassert [g() for g in gs]==[0,1,2]\nassert make_adder(0)(0)==0"
  },
  {
    "id": "py-global-nonlocal",
    "title": "global vs nonlocal",
    "q": [
      "python global keyword",
      "nonlocal in python",
      "UnboundLocalError",
      "modify variable from inner function",
      "why cannot I change outer variable"
    ],
    "tags": "global nonlocal scope UnboundLocalError closure counter variable",
    "a": "Assigning to a name inside a function makes it local. Use `global x` to rebind a module-level name and `nonlocal x` to rebind a variable of the enclosing function. Mutating an object (like `lst.append`) needs neither.",
    "code": {
      "py": "count = 0\ndef inc():\n    global count\n    count += 1\ninc(); inc()\nprint(count)            # 2\n\ndef counter():\n    n = 0\n    def step():\n        nonlocal n\n        n += 1\n        return n\n    return step\ns = counter(); s()\nprint(s())              # 2"
    },
    "more": "In recursion, a common pattern is `nonlocal best` in a nested DFS helper, or pass a one-element list/object instead of a global.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert count==2\nassert s()==3\ndef bad2():\n    zz += 1\ntry:\n    bad2(); raise SystemExit(1)\nexcept UnboundLocalError: pass"
  },
  {
    "id": "py-class-basics",
    "title": "Define a class with __init__ and __repr__",
    "q": [
      "how to create a class in python",
      "python class init",
      "what is self in python",
      "__repr__ vs __str__",
      "print object nicely"
    ],
    "tags": "class init self repr str object constructor method attribute",
    "a": "Define `__init__(self, ...)` to set attributes and `__repr__(self)` to return a readable string. `self` is the instance the method is called on, passed automatically.",
    "code": {
      "py": "class Point:\n    def __init__(self, x, y):\n        self.x = x\n        self.y = y\n\n    def dist2(self):\n        return self.x ** 2 + self.y ** 2\n\n    def __repr__(self):\n        return f\"Point({self.x}, {self.y})\"\n\np = Point(3, 4)\nprint(p, p.dist2())   # Point(3, 4) 25"
    },
    "more": "`print` uses `__str__` if present, else `__repr__`. In interviews, node classes like `ListNode` and `TreeNode` are just this pattern.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert repr(p)==\"Point(3, 4)\"\nassert p.dist2()==25\nassert Point(0,0).dist2()==0"
  },
  {
    "id": "py-eq-hash",
    "title": "Make objects comparable and hashable (__eq__, __hash__)",
    "q": [
      "python __eq__ __hash__",
      "use custom object as dict key",
      "objects equal but not in set",
      "override equality python",
      "unhashable type class"
    ],
    "tags": "__eq__ __hash__ equality hashable dict key set object custom",
    "a": "Define `__eq__` to say when two objects are equal and `__hash__` to hash the same fields, so equal objects have equal hashes. Defining `__eq__` alone sets `__hash__` to None and makes instances unhashable.",
    "code": {
      "py": "class P:\n    def __init__(self, x, y):\n        self.x, self.y = x, y\n    def __eq__(self, o):\n        return isinstance(o, P) and (self.x, self.y) == (o.x, o.y)\n    def __hash__(self):\n        return hash((self.x, self.y))\n\ns = {P(1, 2)}\nprint(P(1, 2) in s)    # True\nprint(P(1, 2) == P(1, 3))  # False"
    },
    "more": "Only hash fields that never change while the object is in a set or dict. Simplest alternative: use tuples, or `@dataclass(frozen=True)`.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert P(1,2) in s\nassert P(1,2)!=P(1,3)\nassert len({P(1,2),P(1,2),P(2,1)})==2\nassert P(1,2)!=5"
  },
  {
    "id": "py-lt-sorting",
    "title": "Make objects sortable (__lt__)",
    "q": [
      "python __lt__",
      "sort a list of objects",
      "heap with custom objects",
      "custom class comparison",
      "sort objects by attribute"
    ],
    "tags": "__lt__ sort objects heapq custom comparison total_ordering key attribute",
    "a": "Sort objects with `key=lambda o: o.attr`. To let them sort (and work in `heapq`) without a key, define `__lt__`. Python only needs `<` for `sort` and `heapq`.",
    "code": {
      "py": "import heapq\nclass Job:\n    def __init__(self, pri, name):\n        self.pri, self.name = pri, name\n    def __lt__(self, other):\n        return self.pri < other.pri\n\njobs = [Job(3, \"c\"), Job(1, \"a\"), Job(2, \"b\")]\nprint([j.name for j in sorted(jobs)])      # ['a', 'b', 'c']\nprint([j.name for j in sorted(jobs, key=lambda j: -j.pri)])  # ['c', 'b', 'a']\nh = list(jobs); heapq.heapify(h)\nprint(heapq.heappop(h).name)               # a"
    },
    "more": "For heaps the common trick is pushing tuples `(priority, counter, item)`; the counter avoids comparing items on ties.",
    "see": [
      "#/cheatsheets/python",
      "#/topic/heaps",
      "#/topic/sorting"
    ],
    "check": "assert [j.name for j in sorted(jobs)]==[\"a\",\"b\",\"c\"]\nassert heapq.heappop(h).name==\"b\"\nassert [j.name for j in sorted(jobs,key=lambda j:-j.pri)][0]==\"c\""
  },
  {
    "id": "py-dataclass",
    "title": "Use a dataclass",
    "q": [
      "python dataclass",
      "simple class with fields",
      "dataclass order frozen",
      "named tuple vs dataclass",
      "auto generate init repr eq"
    ],
    "tags": "dataclass namedtuple frozen order fields init repr eq record struct",
    "a": "`@dataclass` generates `__init__`, `__repr__` and `__eq__` from annotated fields. Add `order=True` for comparisons and `frozen=True` to make instances immutable and hashable.",
    "code": {
      "py": "from dataclasses import dataclass, field\n\n@dataclass(order=True, frozen=True)\nclass Item:\n    cost: int\n    name: str = \"\"\n\nprint(Item(2, \"b\"))                 # Item(cost=2, name='b')\nprint(Item(1) < Item(2))            # True\nprint(len({Item(1), Item(1)}))      # 1\n\n@dataclass\nclass Bag:\n    items: list = field(default_factory=list)"
    },
    "more": "A mutable default needs `field(default_factory=list)`. `collections.namedtuple` is a lighter immutable alternative.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert Item(1)<Item(2)\nassert Item(2,\"b\")==Item(2,\"b\")\nassert len({Item(1),Item(1)})==1\nb=Bag();b.items.append(1);assert Bag().items==[]"
  },
  {
    "id": "py-exceptions",
    "title": "Handle exceptions: try, except, finally",
    "q": [
      "python try except",
      "how to catch an exception",
      "raise an error in python",
      "try except else finally",
      "custom exception python"
    ],
    "tags": "exception try except finally raise ValueError error handling catch else custom",
    "a": "Wrap risky code in `try:` and catch specific errors with `except ValueError:`. `else` runs when no error happened and `finally` always runs. Use `raise ValueError(\"msg\")` to signal bad input.",
    "code": {
      "py": "def to_int(s):\n    try:\n        return int(s)\n    except ValueError:\n        return None\n    finally:\n        pass   # cleanup would go here\n\nprint(to_int(\"12\"), to_int(\"x\"))   # 12 None\n\nclass EmptyError(Exception):\n    pass\n\ndef first(a):\n    if not a:\n        raise EmptyError(\"empty\")\n    return a[0]"
    },
    "more": "Catch the narrowest exception you can; a bare `except:` also hides `KeyboardInterrupt`. Python style often prefers try/except (EAFP) over pre-checks.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert to_int(\"12\")==12 and to_int(\"x\") is None\nassert first([4])==4\ntry:\n    first([]); raise SystemExit(1)\nexcept EmptyError as e:\n    assert str(e)==\"empty\""
  },
  {
    "id": "py-truthiness",
    "title": "Truthy and falsy values",
    "q": [
      "python truthy falsy",
      "what is false in python",
      "if list empty check",
      "if not x vs x is None",
      "is 0 false in python"
    ],
    "tags": "truthy falsy bool empty None zero if not len check",
    "a": "Falsy values: `False`, `None`, `0`, `0.0`, `\"\"`, `[]`, `()`, `{}`, `set()`. Everything else is truthy. Check emptiness with `if not lst:`, but use `is None` when 0 or an empty container is a valid value.",
    "code": {
      "py": "def f(x):\n    return \"none\" if x is None else (\"falsy\" if not x else \"truthy\")\n\nprint([f(v) for v in [None, 0, \"\", [], \"0\", [0], -1]])\n# ['none', 'falsy', 'falsy', 'falsy', 'truthy', 'truthy', 'truthy']\nprint(bool([]), bool([[]]))   # False True"
    },
    "more": "The string `\"0\"` and a list containing 0 are truthy. `x or default` returns `default` for any falsy `x`, including 0.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert [f(v) for v in [None,0,\"\",[],\"0\",[0],-1]]==[\"none\",\"falsy\",\"falsy\",\"falsy\",\"truthy\",\"truthy\",\"truthy\"]\nassert not bool(set()) and bool(\" \")"
  },
  {
    "id": "py-is-vs-eq",
    "title": "is vs == in Python",
    "q": [
      "difference between is and ==",
      "when to use is in python",
      "is None vs == None",
      "compare lists with is"
    ],
    "tags": "is == identity equality None singleton compare id",
    "a": "`==` asks whether two values are equal; `is` asks whether they are the very same object. Use `is` only for singletons: `x is None`, `x is True`. Use `==` for everything else.",
    "code": {
      "py": "a = [1, 2]\nb = [1, 2]\nc = a\nprint(a == b, a is b, a is c)   # True False True\nx = None\nprint(x is None)                # True\nprint(id(a) == id(c))           # True"
    },
    "more": "Do not compare ints or strings with `is`: small values may be cached by CPython, giving results that look right until they do not.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert a==b and a is not b and a is c\nassert x is None"
  },
  {
    "id": "py-any-all",
    "title": "any() and all()",
    "q": [
      "python any all",
      "check if any element satisfies condition",
      "check if all elements are positive",
      "any vs all",
      "any in generator"
    ],
    "tags": "any all check condition generator short circuit exists every",
    "a": "`any(it)` is True if at least one item is truthy; `all(it)` is True if every item is. Feed them a generator expression, and they stop as soon as the answer is known.",
    "code": {
      "py": "nums = [2, 4, 7]\nprint(any(x % 2 for x in nums))     # True (7 is odd)\nprint(all(x > 0 for x in nums))     # True\nprint(all([]), any([]))             # True False\nprint(any(c.isdigit() for c in \"ab3\"))  # True"
    },
    "more": "`all([])` is True (vacuous truth) and `any([])` is False. Passing a list comprehension instead of a generator builds the whole list first.",
    "cx": "Time O(n) worst, short-circuits",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert any(x%2 for x in nums)\nassert all(x>0 for x in nums)\nassert all([]) is True and any([]) is False\nassert not all(x%2==0 for x in nums)"
  },
  {
    "id": "py-ternary",
    "title": "Ternary (conditional) expression",
    "q": [
      "python ternary operator",
      "one line if else",
      "inline if else in python",
      "conditional expression",
      "x if c else y"
    ],
    "tags": "ternary conditional expression inline if else one line",
    "a": "Python writes the ternary as `value_if_true if condition else value_if_false`. It is an expression, so you can use it in assignments, returns and comprehensions.",
    "code": {
      "py": "x = 7\nlabel = \"big\" if x > 5 else \"small\"\nprint(label)                              # big\nprint([n if n > 0 else 0 for n in [-1, 2]])  # [0, 2]\nsign = 1 if x > 0 else (-1 if x < 0 else 0)\nprint(sign)                               # 1"
    },
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert label==\"big\"\nassert [n if n>0 else 0 for n in [-1,2]]==[0,2]\nassert sign==1"
  },
  {
    "id": "py-read-input",
    "title": "Read input in Python",
    "q": [
      "how to read input in python",
      "read multiple integers from a line",
      "sys.stdin readline",
      "read all lines from stdin",
      "competitive programming fast input"
    ],
    "tags": "input stdin sys readline map int split read lines competitive fast io",
    "a": "`input()` reads one line as a string; parse numbers with `list(map(int, input().split()))`. For many lines use `sys.stdin.readline` or `sys.stdin.read().split()`, which are much faster.",
    "code": {
      "py": "import sys, io\nsys.stdin = io.StringIO(\"3\\n1 2 3\\nhello\\n\")   # stand-in for real input\nn = int(input())\nnums = list(map(int, input().split()))\nword = sys.stdin.readline().strip()\nprint(n, nums, word)    # 3 [1, 2, 3] hello"
    },
    "more": "`input()` strips the newline; `sys.stdin.readline()` keeps it, so call `.strip()`. At EOF, `input()` raises `EOFError`. Interview platforms usually give function arguments, not stdin.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert n==3 and nums==[1,2,3] and word==\"hello\"\nsys.stdin=io.StringIO(\"1 2\\n3 4\\n\")\nassert sys.stdin.read().split()==[\"1\",\"2\",\"3\",\"4\"]"
  },
  {
    "id": "py-char-checks",
    "title": "Check character types (isdigit, isalpha, isalnum)",
    "q": [
      "check if string is a number python",
      "isdigit isalpha isalnum",
      "is character a letter",
      "check if all characters are digits",
      "is a char uppercase"
    ],
    "tags": "isdigit isalpha isalnum isspace isupper islower check character type validate",
    "a": "Use `c.isdigit()`, `c.isalpha()`, `c.isalnum()`, `c.isspace()`, `c.isupper()`, `c.islower()`. Each returns True only if the string is non-empty and all characters match.",
    "code": {
      "py": "print(\"123\".isdigit(), \"12a\".isdigit())   # True False\nprint(\"abc\".isalpha(), \"a1\".isalnum())    # True True\nprint(\"\".isdigit())                       # False\nprint(\"-5\".isdigit())                     # False (sign)\nprint(sum(c.isupper() for c in \"aBcD\"))   # 2"
    },
    "more": "To validate a signed integer, try `int(s)` inside `try/except ValueError`.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert \"123\".isdigit() and not \"12a\".isdigit()\nassert not \"\".isdigit()\nassert not \"-5\".isdigit()\nassert sum(c.isupper() for c in \"aBcD\")==2"
  },
  {
    "id": "py-letter-count-array",
    "title": "Use an array for lowercase letter counts",
    "q": [
      "count letters with array of 26",
      "index of letter a-z",
      "fixed size frequency array",
      "anagram with 26 array"
    ],
    "tags": "array 26 letters count frequency ord lowercase index bucket",
    "a": "For lowercase letters make `[0] * 26` and use `ord(c) - ord(\"a\")` as the index. It is O(1) space and faster than a dict. Lists compare equal with `==`, which makes anagram checks easy.",
    "code": {
      "py": "def counts(s):\n    arr = [0] * 26\n    for c in s:\n        arr[ord(c) - ord(\"a\")] += 1\n    return arr\n\nprint(counts(\"abca\")[:3])                    # [2, 1, 1]\nprint(counts(\"listen\") == counts(\"silent\"))  # True"
    },
    "more": "Convert the list to a tuple if you need it as a dict key: `tuple(counts(w))`.",
    "cx": "Time O(n), space O(1)",
    "see": [
      "#/cheatsheets/python",
      "#/topic/arrays-hashing"
    ],
    "check": "assert counts(\"abca\")[:3]==[2,1,1]\nassert counts(\"listen\")==counts(\"silent\")\nassert counts(\"\")==[0]*26"
  },
  {
    "id": "py-string-compare",
    "title": "Compare strings and sort them",
    "q": [
      "compare two strings python",
      "lexicographic order",
      "string less than",
      "sort strings alphabetically",
      "compare strings ignoring case"
    ],
    "tags": "string compare lexicographic order less than sort alphabetical case ignore",
    "a": "Strings compare with `==`, `<` and `>` in lexicographic (dictionary) order by character code, so uppercase sorts before lowercase. Use `key=str.lower` for case-insensitive sorting.",
    "code": {
      "py": "print(\"apple\" < \"banana\")              # True\nprint(\"Z\" < \"a\")                       # True (uppercase first)\nprint(\"abc\" < \"abcd\")                  # True (prefix is smaller)\nprint(sorted([\"b\", \"A\", \"a\"], key=str.lower))   # ['A', 'a', 'b']\nprint(max(\"apple\", \"pear\"))            # pear"
    },
    "more": "Comparison is by Unicode code point, not by locale rules.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert \"apple\"<\"banana\" and \"Z\"<\"a\" and \"abc\"<\"abcd\"\nassert sorted([\"b\",\"A\",\"a\"],key=str.lower)==[\"A\",\"a\",\"b\"]\nassert \"a\"==\"a\""
  },
  {
    "id": "py-slice-list",
    "title": "Slice a list and common slice tricks",
    "q": [
      "python list slicing",
      "get first n elements of list",
      "last k elements of list",
      "copy list with slice",
      "every other element"
    ],
    "tags": "list slice first last n elements copy step sublist subarray",
    "a": "Use `a[:n]` for the first n, `a[-k:]` for the last k (careful with k = 0), `a[i:j]` for a sublist, `a[::2]` for every other item, and `a[:]` for a shallow copy. Slice assignment can replace a range.",
    "code": {
      "py": "a = [0, 1, 2, 3, 4, 5]\nprint(a[:2], a[-2:])     # [0, 1] [4, 5]\nprint(a[1:4])           # [1, 2, 3]\nprint(a[::2])           # [0, 2, 4]\nprint(a[2:2])           # []\na[1:3] = [9]\nprint(a)                # [0, 9, 3, 4, 5]\ndel a[::2]\nprint(a)                # [9, 4]"
    },
    "more": "`a[-0:]` is the whole list, not empty, because -0 is 0. Use `a[len(a)-k:]` when k may be 0.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert a==[9,4]\nassert [1,2,3][-0:]==[1,2,3]\nassert [0,1][10:]==[]\nassert [0,1,2,3][:2]==[0,1]"
  },
  {
    "id": "py-copy-2d",
    "title": "Copy a 2-D list",
    "q": [
      "copy a matrix in python",
      "deep copy grid",
      "copy list of lists",
      "clone 2d array python"
    ],
    "tags": "copy matrix grid 2d deepcopy list comprehension clone rows",
    "a": "A shallow copy shares the inner rows. Copy a grid with `[row[:] for row in grid]` or `copy.deepcopy(grid)`.",
    "code": {
      "py": "import copy\ngrid = [[1, 2], [3, 4]]\nshallow = grid[:]\nclone = [row[:] for row in grid]\ndeep = copy.deepcopy(grid)\ngrid[0][0] = 99\nprint(shallow[0][0], clone[0][0], deep[0][0])   # 99 1 1"
    },
    "more": "The row-wise comprehension is faster than `deepcopy` and enough for lists of ints.",
    "cx": "Time O(rows*cols)",
    "see": [
      "#/topic/matrix",
      "#/cheatsheets/python"
    ],
    "check": "assert shallow[0][0]==99 and clone[0][0]==1 and deep[0][0]==1\nassert clone is not grid and clone[0] is not grid[0]"
  },
  {
    "id": "py-stack-queue",
    "title": "Use a list as a stack and deque as a queue",
    "q": [
      "stack in python",
      "queue in python",
      "how to implement a stack with list",
      "deque popleft",
      "collections deque"
    ],
    "tags": "stack queue deque list append pop popleft LIFO FIFO",
    "a": "A list is a good stack: `append` to push, `pop()` to pop, `a[-1]` to peek, all O(1). For a queue use `collections.deque`: `append` to enqueue and `popleft()` to dequeue in O(1); `list.pop(0)` is O(n).",
    "code": {
      "py": "from collections import deque\nstack = []\nstack.append(1); stack.append(2)\nprint(stack[-1], stack.pop())   # 2 2\nq = deque()\nq.append(\"a\"); q.append(\"b\")\nprint(q.popleft(), len(q))      # a 1\nprint(bool(q), bool(deque()))   # True False"
    },
    "more": "Check emptiness with `if stack:` / `if q:`. `deque(maxlen=k)` auto-drops old items, handy for sliding windows.",
    "see": [
      "#/cheatsheets/python",
      "#/topic/stacks",
      "#/topic/queues"
    ],
    "check": "assert stack==[1]\nassert list(q)==[\"b\"]\nassert not deque()"
  },
  {
    "id": "py-heapq-basics",
    "title": "Use heapq (min-heap) in Python",
    "q": [
      "python heapq",
      "priority queue in python",
      "max heap in python",
      "heapq push pop",
      "k smallest elements"
    ],
    "tags": "heapq heap priority queue min heap max heap negate push pop nlargest nsmallest",
    "a": "`heapq` provides a min-heap on a plain list: `heappush(h, x)`, `heappop(h)` (smallest), `h[0]` to peek, `heapify(list)` in O(n). For a max-heap push negated values.",
    "code": {
      "py": "import heapq\nh = []\nfor x in [5, 1, 3]:\n    heapq.heappush(h, x)\nprint(h[0], heapq.heappop(h))   # 1 1\nmax_h = []\nfor x in [5, 1, 3]:\n    heapq.heappush(max_h, -x)\nprint(-heapq.heappop(max_h))    # 5\nprint(heapq.nsmallest(2, [5, 1, 3, 2]))   # [1, 2]"
    },
    "more": "Push and pop are O(log n). Use tuples `(priority, item)` for priority queues.",
    "see": [
      "#/cheatsheets/python",
      "#/topic/heaps"
    ],
    "check": "assert heapq.heappop(h)==3\nassert -heapq.heappop(max_h)==3\nassert heapq.nsmallest(2,[5,1,3,2])==[1,2]"
  },
  {
    "id": "py-type-check",
    "title": "Check the type of a value",
    "q": [
      "python check type of variable",
      "isinstance example",
      "is variable a list",
      "type() vs isinstance"
    ],
    "tags": "type isinstance check list int str float bool subclass",
    "a": "Use `isinstance(x, list)`, or a tuple of types `isinstance(x, (int, float))`. It also accepts subclasses, unlike `type(x) == list`. Note that `bool` is a subclass of `int`.",
    "code": {
      "py": "x = [1, 2]\nprint(isinstance(x, list))              # True\nprint(isinstance(3, (int, float)))      # True\nprint(isinstance(True, int))            # True\nprint(type(3.0).__name__)               # float"
    },
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert isinstance(x,list) and isinstance(3,(int,float))\nassert isinstance(True,int)\nassert type(3.0).__name__==\"float\"\nassert not isinstance(\"a\",int)"
  },
  {
    "id": "py-float-compare",
    "title": "Compare floats safely",
    "q": [
      "why is 0.1 + 0.2 not 0.3",
      "compare floating point numbers python",
      "float equality",
      "isclose python"
    ],
    "tags": "float precision isclose equality 0.1+0.2 epsilon decimal fraction",
    "a": "Floats are binary approximations, so `0.1 + 0.2 != 0.3`. Compare with `math.isclose(a, b)`, or avoid floats by using integers, `fractions.Fraction` or `decimal.Decimal`.",
    "code": {
      "py": "import math\nfrom fractions import Fraction\nprint(0.1 + 0.2 == 0.3)               # False\nprint(math.isclose(0.1 + 0.2, 0.3))   # True\nprint(Fraction(1, 10) + Fraction(2, 10) == Fraction(3, 10))  # True"
    },
    "more": "Binary search on real numbers: loop a fixed number of iterations (e.g. 100) instead of testing `lo == hi`.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert 0.1+0.2!=0.3\nassert math.isclose(0.1+0.2,0.3)\nassert Fraction(1,10)+Fraction(2,10)==Fraction(3,10)\nassert 0.5+0.25==0.75"
  },
  {
    "id": "py-abs-pow-sqrt",
    "title": "abs, power and square root",
    "q": [
      "python power operator",
      "square root in python",
      "absolute value",
      "integer square root",
      "math.sqrt vs ** 0.5"
    ],
    "tags": "abs pow sqrt isqrt power exponent math square root",
    "a": "Use `abs(x)`, `x ** n` or `pow(x, n)`, `math.sqrt(x)` for a float root, and `math.isqrt(n)` for an exact integer square root (3.8+).",
    "code": {
      "py": "import math\nprint(abs(-5), 2 ** 10)       # 5 1024\nprint(math.sqrt(16))          # 4.0\nprint(math.isqrt(17))         # 4\nprint(pow(2, 10, 1000))       # 24  (mod)\nprint(math.isqrt(10**18))     # 1000000000"
    },
    "more": "`**` with a negative exponent returns a float. `isqrt` avoids float rounding on large numbers.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert abs(-5)==5 and 2**10==1024\nassert math.isqrt(17)==4 and math.isqrt(10**18)==10**9\nassert math.sqrt(16)==4.0\nassert 2**-1==0.5\nassert pow(2,10,1000)==24"
  },
  {
    "id": "py-gcd-lcm",
    "title": "GCD and LCM",
    "q": [
      "python gcd",
      "least common multiple python",
      "greatest common divisor",
      "math.gcd multiple numbers",
      "lcm of a list"
    ],
    "tags": "gcd lcm greatest common divisor least common multiple math reduce",
    "a": "`math.gcd(a, b)` gives the greatest common divisor and `math.lcm(a, b)` the least common multiple (3.9+). Before 3.9, `lcm = a // gcd(a, b) * b`. Fold a list with `functools.reduce`.",
    "code": {
      "py": "import math\nfrom functools import reduce\nprint(math.gcd(12, 18))              # 6\nprint(12 // math.gcd(12, 18) * 18)   # 36\nprint(math.lcm(4, 6))                # 12\nprint(reduce(math.gcd, [12, 18, 30]))  # 6"
    },
    "more": "Euclid's algorithm: `while b: a, b = b, a % b`.",
    "cx": "Time O(log min(a,b))",
    "see": [
      "#/cheatsheets/python",
      "#/topic/math"
    ],
    "check": "assert math.gcd(12,18)==6 and math.gcd(0,5)==5\nassert math.lcm(4,6)==12\nassert reduce(math.gcd,[12,18,30])==6"
  },
  {
    "id": "py-prefix-accumulate",
    "title": "Running sum with itertools.accumulate",
    "q": [
      "prefix sum python",
      "cumulative sum of list",
      "running total python",
      "accumulate itertools"
    ],
    "tags": "prefix sum cumulative accumulate running total itertools range sum",
    "a": "Use `list(itertools.accumulate(a))` for a running total. For range-sum queries build `pre = [0] + list(accumulate(a))`, then sum of `a[i:j]` is `pre[j] - pre[i]`.",
    "code": {
      "py": "from itertools import accumulate\na = [3, 1, 4, 1, 5]\npre = [0] + list(accumulate(a))\nprint(pre)                 # [0, 3, 4, 8, 9, 14]\nprint(pre[4] - pre[1])     # 8  == sum(a[1:4])\nprint(list(accumulate(a, max)))   # [3, 3, 4, 4, 5]"
    },
    "more": "Build O(n), each query O(1).",
    "cx": "Time O(n) build",
    "see": [
      "#/cheatsheets/python",
      "#/topic/prefix-sums"
    ],
    "check": "assert pre==[0,3,4,8,9,14]\nassert pre[4]-pre[1]==sum(a[1:4])\nassert list(accumulate([]))==[]"
  },
  {
    "id": "py-with-open",
    "title": "Read and write files",
    "q": [
      "how to read a file in python",
      "write to a file python",
      "with open",
      "read file line by line"
    ],
    "tags": "file open read write with lines context manager",
    "a": "Use `with open(path) as f:` so the file is closed automatically. `f.read()` gets everything, iterating `for line in f` goes line by line, and mode `\"w\"` writes.",
    "code": {
      "py": "import os, tempfile\npath = os.path.join(tempfile.gettempdir(), \"or_demo.txt\")\nwith open(path, \"w\") as f:\n    f.write(\"a\\nb\\n\")\nwith open(path) as f:\n    lines = [ln.rstrip(\"\\n\") for ln in f]\nprint(lines)   # ['a', 'b']\nos.remove(path)"
    },
    "more": "Mode `\"a\"` appends and `\"r\"` is the default. Pass `encoding=\"utf-8\"` for text portability.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert lines==[\"a\",\"b\"]\nassert not os.path.exists(path)"
  },
  {
    "id": "py-modify-in-loop",
    "title": "Update list elements in a loop",
    "q": [
      "modify list in for loop python",
      "change values in list while iterating",
      "double every element in list",
      "in-place update with enumerate"
    ],
    "tags": "modify update list loop enumerate index in place map comprehension",
    "a": "Assigning to the loop variable does not change the list. Either build a new list with a comprehension or assign by index with `enumerate`.",
    "code": {
      "py": "a = [1, 2, 3]\nfor x in a:\n    x *= 2\nprint(a)                       # [1, 2, 3]  (unchanged)\nfor i in range(len(a)):\n    a[i] *= 2\nprint(a)                       # [2, 4, 6]\nb = [x + 1 for x in a]\nprint(b)                       # [3, 5, 7]\nfor i, x in enumerate(a):\n    a[i] = x + 1\nprint(a)                       # [3, 5, 7]"
    },
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert a==[3,5,7] and b==[3,5,7]"
  },
  {
    "id": "py-max-min-key",
    "title": "Find the max by custom criteria",
    "q": [
      "max with key function",
      "longest string in list",
      "find the item with smallest value",
      "argmax in python",
      "min of list of tuples by field"
    ],
    "tags": "max min key longest string argmax tuple lambda default criteria",
    "a": "Give `max` or `min` a `key=` function: `max(words, key=len)`. It returns the first best item, not the key value. For the best index use `max(range(n), key=lambda i: a[i])`.",
    "code": {
      "py": "words = [\"aa\", \"bbbb\", \"c\", \"dddd\"]\nprint(max(words, key=len))              # bbbb (first of ties)\npairs = [(\"a\", 5), (\"b\", 2)]\nprint(min(pairs, key=lambda p: p[1]))   # ('b', 2)\na = [3, 9, 2]\nprint(max(range(len(a)), key=lambda i: a[i]))   # 1"
    },
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert max(words,key=len)==\"bbbb\"\nassert min(pairs,key=lambda p:p[1])==(\"b\",2)\nassert max(range(len(a)),key=lambda i:a[i])==1"
  },
  {
    "id": "py-string-chars",
    "title": "Convert a string to a list of characters and back",
    "q": [
      "string to list of characters python",
      "split string into characters",
      "list to string",
      "join characters",
      "convert string to set of chars"
    ],
    "tags": "string list characters convert chars join list(s) set",
    "a": "`list(s)` gives a list of characters, and `\"\".join(chars)` turns it back. `set(s)` gives the distinct characters; `sorted(s)` gives sorted characters.",
    "code": {
      "py": "s = \"hello\"\nchars = list(s)\nprint(chars)                 # ['h', 'e', 'l', 'l', 'o']\nprint(\"\".join(sorted(s)))    # ehllo\nprint(len(set(s)))           # 4\nprint(\"\".join(chars[::-1]))  # olleh"
    },
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert chars==list(\"hello\")\nassert \"\".join(sorted(s))==\"ehllo\"\nassert len(set(s))==4\nassert list(\"\")==[]"
  },
  {
    "id": "py-recursion-limit",
    "title": "Recursion limit and deep recursion",
    "q": [
      "python recursion limit",
      "maximum recursion depth exceeded",
      "increase recursion limit",
      "recursion error in dfs"
    ],
    "tags": "recursion limit RecursionError sys.setrecursionlimit depth stack iterative dfs",
    "a": "CPython limits recursion to about 1000 frames by default and raises `RecursionError` beyond that. Raise it with `sys.setrecursionlimit(n)` for deep DFS or recursion, or rewrite the algorithm iteratively with an explicit stack.",
    "code": {
      "py": "import sys\nprint(sys.getrecursionlimit())     # usually 1000\nsys.setrecursionlimit(10000)\n\ndef depth(n):\n    return 0 if n == 0 else 1 + depth(n - 1)\nprint(depth(5000))                 # 5000"
    },
    "more": "A very high limit can crash the interpreter with a real stack overflow; in interviews mention converting to an iterative stack.",
    "see": [
      "#/cheatsheets/python",
      "#/topic/recursion"
    ],
    "check": "assert depth(5000)==5000\nsys.setrecursionlimit(1000)\ntry:\n    depth(5000); raise SystemExit(1)\nexcept RecursionError: pass"
  },
  {
    "id": "py-filter-map",
    "title": "Filter and map with comprehensions",
    "q": [
      "filter a list in python",
      "map in python",
      "apply function to every element",
      "list comprehension vs map",
      "get elements that match condition"
    ],
    "tags": "filter map comprehension list apply function condition where",
    "a": "Prefer a comprehension: `[f(x) for x in a if cond(x)]`. `map(f, a)` and `filter(cond, a)` return lazy iterators, so wrap them in `list(...)` if you need a list.",
    "code": {
      "py": "a = [1, 2, 3, 4]\nprint([x * 10 for x in a if x > 2])         # [30, 40]\nprint(list(map(str, a)))                    # ['1', '2', '3', '4']\nprint(list(filter(lambda x: x % 2, a)))     # [1, 3]\nm = map(abs, [-1, -2])\nprint(list(m), list(m))                     # [1, 2] [] (iterator is used up)"
    },
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert [x*10 for x in a if x>2]==[30,40]\nassert list(map(str,a))==[\"1\",\"2\",\"3\",\"4\"]\nassert list(filter(lambda x:x%2,a))==[1,3]\nassert list(m)==[]"
  },
  {
    "id": "py-bisect-module",
    "title": "Binary search on a sorted list (bisect)",
    "q": [
      "python bisect",
      "binary search built in python",
      "insert into sorted list",
      "find insertion position",
      "bisect_left vs bisect_right"
    ],
    "tags": "bisect bisect_left bisect_right insort binary search sorted insertion lower bound upper bound",
    "a": "`bisect.bisect_left(a, x)` returns the first index where x could be inserted (lower bound); `bisect_right` returns the index after any existing x (upper bound). `insort` inserts and keeps the list sorted.",
    "code": {
      "py": "from bisect import bisect_left, bisect_right, insort\na = [1, 3, 3, 5]\nprint(bisect_left(a, 3), bisect_right(a, 3))   # 1 3\nprint(bisect_left(a, 4))                       # 3\ninsort(a, 4)\nprint(a)                                       # [1, 3, 3, 4, 5]\ni = bisect_left(a, 5)\nprint(i < len(a) and a[i] == 5)                # True (membership)"
    },
    "more": "Search is O(log n), but `insort` is O(n) because inserting shifts elements. The list must already be sorted.",
    "cx": "Time O(log n) search",
    "see": [
      "#/cheatsheets/python",
      "#/topic/binary-search"
    ],
    "check": "assert a==[1,3,3,4,5]\nassert bisect_left([1,3,3,5],3)==1 and bisect_right([1,3,3,5],3)==3\nassert bisect_left([1],0)==0 and bisect_left([1],9)==1"
  },
  {
    "id": "py-repeat-pad",
    "title": "Repeat a string or list, and pad text",
    "q": [
      "repeat a string n times",
      "multiply string python",
      "repeat list elements",
      "print a line of dashes",
      "pad a string to a width"
    ],
    "tags": "repeat multiply string list * times pad fill ljust rjust zfill center",
    "a": "Use `*`: `\"ab\" * 3` is `\"ababab\"` and `[0] * 3` is `[0, 0, 0]`. For padding, `s.ljust(w)`, `s.rjust(w)`, `s.center(w)` and `s.zfill(w)`.",
    "code": {
      "py": "print(\"ab\" * 3)             # ababab\nprint(\"-\" * 10)\nprint([0] * 3)              # [0, 0, 0]\nprint(\"7\".zfill(3))         # 007\nprint(\"hi\".rjust(5, \".\"))   # ...hi\nprint(\"x\" * 0 == \"\")        # True"
    },
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert \"ab\"*3==\"ababab\" and [0]*3==[0,0,0]\nassert \"7\".zfill(3)==\"007\"\nassert \"hi\".rjust(5,\".\")==\"...hi\"\nassert \"x\"*-1==\"\""
  },
  {
    "id": "py-counter-ops",
    "title": "Counter tricks",
    "q": [
      "counter most common",
      "compare two counters",
      "counter subtract",
      "use counter as multiset",
      "counter update"
    ],
    "tags": "Counter most_common multiset subtract elements compare arithmetic update",
    "a": "A `Counter` is a dict subclass that maps item to count. `most_common(k)` lists top items, `c1 - c2` keeps positive differences, `c1 & c2` takes minimum counts, and `c.update(iterable)` adds counts.",
    "code": {
      "py": "from collections import Counter\nc = Counter(\"aabbbc\")\nprint(c.most_common(2))                 # [('b', 3), ('a', 2)]\nprint(Counter(\"aab\") - Counter(\"ab\"))   # Counter({'a': 1})\nprint(Counter(\"aab\") & Counter(\"abb\"))  # Counter({'a': 1, 'b': 1})\nc.update(\"zz\")\nprint(c[\"z\"], sum(c.values()))          # 2 8\nprint(not (Counter(\"aab\") - Counter(\"aabc\")))   # True: \"aab\" fits inside \"aabc\""
    },
    "see": [
      "#/cheatsheets/python",
      "#/topic/arrays-hashing"
    ],
    "check": "assert c.most_common(1)==[(\"b\",3)]\nassert Counter(\"aab\")-Counter(\"ab\")=={\"a\":1}\nassert Counter(\"aab\")&Counter(\"abb\")=={\"a\":1,\"b\":1}\nassert c[\"z\"]==2"
  },
  {
    "id": "py-chained-comparison",
    "title": "Chained comparisons and membership tests",
    "q": [
      "python chained comparison",
      "1 < x < 10",
      "check value in range",
      "multiple conditions python",
      "in vs or"
    ],
    "tags": "chained comparison range between in multiple conditions and or not",
    "a": "Python allows `lo <= x <= hi` as a range test. For several equalities use `x in (a, b, c)` instead of repeating `x == a or x == b`. Combine tests with `and`, `or`, `not`.",
    "code": {
      "py": "x = 5\nprint(1 <= x <= 10)              # True\nprint(x in (3, 5, 7))            # True\nprint(0 <= -1 < 5)               # False\nr, c = 2, 3\nok = 0 <= r < 4 and 0 <= c < 4   # grid bounds check\nprint(ok)                        # True"
    },
    "more": "This is the usual way to write grid-bounds checks. `and`/`or` return an operand, not necessarily a bool.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert 1<=x<=10 and x in (3,5,7)\nassert not (0<=-1<5)\nassert ok"
  },
  {
    "id": "py-grid-neighbors",
    "title": "Loop over grid neighbors (up, down, left, right)",
    "q": [
      "grid neighbors python",
      "4 directions list",
      "loop over up down left right",
      "dx dy directions",
      "neighbors in a matrix"
    ],
    "tags": "grid neighbors directions dx dy up down left right matrix bounds bfs dfs",
    "a": "Keep the moves in a tuple of offsets and loop over them, checking bounds before indexing: `for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):`. Add the four diagonals for 8-way movement.",
    "code": {
      "py": "DIRS = ((1, 0), (-1, 0), (0, 1), (0, -1))\n\ndef neighbors(r, c, R, C):\n    for dr, dc in DIRS:\n        nr, nc = r + dr, c + dc\n        if 0 <= nr < R and 0 <= nc < C:\n            yield nr, nc\n\nprint(sorted(neighbors(0, 0, 3, 3)))   # [(0, 1), (1, 0)]\nprint(len(list(neighbors(1, 1, 3, 3))))  # 4"
    },
    "more": "Use a `visited` set of `(r, c)` tuples or mark cells in place.",
    "cx": "Time O(1) per cell",
    "see": [
      "#/topic/matrix",
      "#/topic/graphs",
      "#/cheatsheets/python"
    ],
    "check": "assert sorted(neighbors(0,0,3,3))==[(0,1),(1,0)]\nassert len(list(neighbors(1,1,3,3)))==4\nassert list(neighbors(0,0,1,1))==[]"
  },
  {
    "id": "py-print-list",
    "title": "Print a list nicely",
    "q": [
      "print list without brackets",
      "print list elements separated by space",
      "join numbers into string",
      "print each element on a line",
      "print without newline"
    ],
    "tags": "print list join sep end separator numbers star unpack output format",
    "a": "Use `print(*a)` to print items separated by spaces, `print(*a, sep=\", \")` for another separator, and `end=\"\"` to avoid the newline. To join numbers convert them with `map(str, a)` first.",
    "code": {
      "py": "a = [1, 2, 3]\nprint(*a)                       # 1 2 3\nprint(*a, sep=\", \")             # 1, 2, 3\nprint(\" \".join(map(str, a)))    # 1 2 3\nprint(*a, sep=\"\\n\")\nfor x in a:\n    print(x, end=\" \")\nprint()"
    },
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert \" \".join(map(str,a))==\"1 2 3\"\nassert \", \".join(str(x) for x in a)==\"1, 2, 3\"\nassert \" \".join(map(str,[]))==\"\""
  },
  {
    "id": "py-chained-assign",
    "title": "Chained assignment and aliasing gotcha",
    "q": [
      "a = b = []",
      "multiple assignment python",
      "assign same value to many variables",
      "variables point to same list"
    ],
    "tags": "assignment chained alias reference same object list mutable a = b = []",
    "a": "`a = b = []` makes both names point to the same list, so changing one changes the other. Assign separately (`a, b = [], []`) when you want independent lists. For ints and strings this is harmless because they are immutable.",
    "code": {
      "py": "a = b = []\na.append(1)\nprint(b)              # [1]\nc, d = [], []\nc.append(1)\nprint(d)              # []\nx = y = 5\nx += 1\nprint(x, y)           # 6 5"
    },
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert b==[1] and a is b\nassert d==[] and c is not d\nassert (x,y)==(6,5)"
  },
  {
    "id": "py-sum-digits",
    "title": "Sum the digits of a number",
    "q": [
      "sum of digits python",
      "digits of a number",
      "reverse an integer",
      "count digits in a number",
      "check palindrome number"
    ],
    "tags": "digits sum number reverse integer palindrome divmod str modulo",
    "a": "Either convert to a string: `sum(int(d) for d in str(n))`, or peel digits with `n % 10` and `n //= 10`. The arithmetic form avoids creating strings.",
    "code": {
      "py": "def digit_sum(n):\n    total = 0\n    n = abs(n)\n    while n:\n        n, d = divmod(n, 10)\n        total += d\n    return total\n\ndef is_pal_num(n):\n    return n >= 0 and str(n) == str(n)[::-1]\n\nprint(digit_sum(1234))     # 10\nprint(is_pal_num(121))     # True"
    },
    "more": "Number of digits: `len(str(n))`. Reversing digits arithmetically: `rev = rev * 10 + n % 10`.",
    "cx": "Time O(digits)",
    "see": [
      "#/cheatsheets/python",
      "#/topic/math"
    ],
    "check": "assert digit_sum(1234)==10 and digit_sum(0)==0 and digit_sum(-45)==9\nassert is_pal_num(121) and not is_pal_num(-121) and not is_pal_num(10)\nassert sum(int(d) for d in str(1234))==10"
  },
  {
    "id": "py-timing-code",
    "title": "Time a piece of code",
    "q": [
      "how to measure execution time python",
      "time.perf_counter",
      "timeit",
      "benchmark python function"
    ],
    "tags": "time perf_counter timeit benchmark measure performance profile elapsed",
    "a": "Use `time.perf_counter()` before and after for a quick measure, or `timeit.timeit(stmt, number=n)` to repeat a small snippet and reduce noise.",
    "code": {
      "py": "import time, timeit\nt0 = time.perf_counter()\nsum(range(100000))\nelapsed = time.perf_counter() - t0\nprint(elapsed >= 0)     # True\nt = timeit.timeit(\"sum(range(1000))\", number=100)\nprint(t > 0)            # True"
    },
    "more": "`perf_counter` is the highest-resolution monotonic clock. Compare timings from several runs, not one.",
    "see": [
      "#/cheatsheets/python"
    ],
    "check": "assert elapsed>=0 and t>0"
  }
  );
})();
