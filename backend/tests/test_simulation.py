import sys
import os

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.solver.pykociemba.cubiecube import CubieCube, moveCube
from app.solver.pykociemba.facecube import FaceCube
from app.solver.pykociemba.search import Search

scramble = 'BBURUDBFUFFFRRFUUFLULUFUDLRRDBBDBDBLUDDFLLRRBRLLLBRDDF'
s = Search()
sol = s.solution(scramble, 21, 5, False).strip().split()
print("Solution:", sol)

fc = FaceCube(scramble)
cc = fc.toCubieCube()

move_map = {
    'U': 0, 'R': 1, 'F': 2, 'D': 3, 'L': 4, 'B': 5
}

for m in sol:
    face = m[0]
    m_idx = move_map[face]
    count = 1
    if len(m) > 1:
        if m[1] == '2':
            count = 2
        elif m[1] == "'":
            count = 3
    for _ in range(count):
        cc.cornerMultiply(moveCube[m_idx])
        cc.edgeMultiply(moveCube[m_idx])

final_fc = cc.toFaceCube()
final_str = final_fc.to_String()
print("Final facelet string:", final_str)
solved_str = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB"
print("Matches solved?", final_str == solved_str)
assert final_str == solved_str
