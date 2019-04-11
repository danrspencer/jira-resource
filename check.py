import sys
import subprocess
from multiprocessing import Process

def print_event(event_url):
    p = subprocess.Popen(
        ['curl', '-sfN', event_url],
        stdout=subprocess.PIPE,
        bufsize=1)

    for line in iter(p.stdout.readline, b''):
        if line == b'event: end\n':
            sys.exit(0)
        print(line.decode("utf-8").strip())

if __name__ == '__main__':
    event_url = sys.argv[1]
    print("Event URL: ", event_url)

    action_process = Process(target=print_event, args=(event_url,))
    action_process.start()
    action_process.join(timeout=25)
    if action_process.is_alive():
        action_process.terminate()
        print("Timeout after 20 second, UI blocking ???")
        sys.exit(-1)
    else:
        action_process.terminate()

