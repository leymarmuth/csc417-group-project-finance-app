#!/usr/bin/env python3
"""Drive the installed Aurum APK on an emulator: onboarding -> demo sign-in -> Home,
then relaunch the app (restored session) and check it is still alive."""
import re, subprocess, sys, time, xml.etree.ElementTree as ET

PKG = "com.aurum.app"
OUT = "smoke"

def adb(*args, check=False):
    return subprocess.run(["adb", *args], capture_output=True, text=True, check=check).stdout

def alive():
    return adb("shell", "pidof", PKG).strip() != ""

def shot(name):
    with open(f"{OUT}/{name}.png", "wb") as f:
        f.write(subprocess.run(["adb", "exec-out", "screencap", "-p"], capture_output=True).stdout)

def nodes():
    adb("shell", "uiautomator", "dump", "/sdcard/ui.xml")
    raw = adb("shell", "cat", "/sdcard/ui.xml")
    try:
        return list(ET.fromstring(raw[raw.find("<"):]).iter("node"))
    except ET.ParseError:
        return []

def screen_size():
    m = re.search(r"(\d+)x(\d+)", adb("shell", "wm", "size"))
    return (int(m.group(1)), int(m.group(2))) if m else (1080, 1920)

def find(label):
    """Exact (case-insensitive) text/content-desc match first, then substring."""
    want = label.strip().lower()
    exact, partial = None, None
    for n in nodes():
        vals = [(n.get("text") or "").strip().lower(), (n.get("content-desc") or "").strip().lower()]
        if want in vals and exact is None:
            exact = n
        elif any(want in v for v in vals) and partial is None:
            partial = n
    return exact if exact is not None else partial

def tap(label, timeout=40, scroll=True):
    w, h = screen_size()
    end = time.time() + timeout
    attempt = 0
    while time.time() < end:
        if not alive():
            print(f"!! app died while waiting for '{label}'")
            return False
        n = find(label)
        if n is not None:
            x1, y1, x2, y2 = map(int, re.findall(r"\d+", n.get("bounds")))
            adb("shell", "input", "tap", str((x1 + x2) // 2), str((y1 + y2) // 2))
            print(f"tapped '{label}'")
            time.sleep(2)
            return True
        attempt += 1
        if scroll and attempt % 2 == 0 and attempt <= 8:
            # Element may be below the fold: scroll the content up a bit.
            adb("shell", "input", "swipe", str(w // 2), str(int(h * 0.75)), str(w // 2), str(int(h * 0.35)), "400")
        time.sleep(2)
    print(f"!! could not find '{label}'")
    return False

def launch():
    adb("shell", "monkey", "-p", PKG, "-c", "android.intent.category.LAUNCHER", "1")

ok = True
launch(); time.sleep(15); shot("01-launch")
for label in ["I already have an account", "Use the demo account", "Sign in"]:
    if not tap(label):
        ok = False
        break
time.sleep(20); shot("02-after-sign-in")
first = alive(); print("alive after sign-in:", first)
adb("shell", "am", "force-stop", PKG); time.sleep(3)
launch(); time.sleep(20); shot("03-relaunch")
second = alive(); print("alive after relaunch:", second)
for i, label in enumerate(["Activity", "Insights", "Goals", "Profile"]):
    if second and tap(label, timeout=15, scroll=False):
        time.sleep(4); shot(f"04-tab-{i}-{label}")
third = alive(); print("alive after visiting tabs:", third)
print("RESULT:", "PASS" if ok and first and second and third else "FAIL")
sys.exit(0 if ok and first and second and third else 1)
