import os
import json
import numpy as np
from soundfile import SoundFile


def gen_json():
    ls = os.listdir('./tokens')
    data = map(lambda v: v.split('.')[0], ls)

    with open('tokens.json', 'w') as f:
        data = json.dumps(list(data))
        f.write(data)
    print('ok')


def gen_blank_audio():
    with SoundFile('tokens/_.wav', 'w', 44100, 1) as f:
        f.write(np.zeros(11025))


if __name__ == '__main__':
    gen_json()