import sys
from cx_Freeze import setup, Executable

'''
setup script for cx_Freeze
http://cx-freeze.sourceforge.net/
'''

base = None
if sys.platform == "win32":
    base = "Win32GUI"

options = {}
options["build_exe"] = {"include_files":["bootstrap","js","LICENSE","login.html","main.html"],"optimize":2}

setup( name = "zkui", version = "0.3", description = "A ZooKeeper GUI Frontend", options = options, executables = [Executable("zkui.py", base=base, icon="apache-feather.ico")])