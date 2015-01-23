# zkui
zkui is a GUI client of [Apache ZooKeeper](http://zookeeper.apache.org/) implemented with Python3 + Qt5 + HTML5.

[here are some snapshots](https://github.com/echoma/zkui/wiki/Snapshots)

# Features
* Browse the ZooKeeper node tree, edit the node's data.
* Copy a node to new path recursively.
* Export / Import between node and your local storage recursively.
* Delete node and its children  recursively.
* ACL(world,digest,ip) supportted.

# Requirement

### 1. Operating System
* I mainly test and use zkui on my Ubuntu Linux 14.04 X64 PC, so there may be some unkown bugs on other OS.
* On MS Windows, multi-bytes charactors are messy. I am new to Python3 and need help to solve this.
* As I tried months ago, On MS Windows, the official Kazoo release is buggy, you have to use my modified version. I will upload this on github soon.

### 2. Python3.x

* The latest version is 3.4.2 as Ｉwrite this. This is also the recommended version. [download it here](http://python.org/)

* PyQt5 package. 

    We use PyQt5 to draw the native window and use its QWebkit to render all the gui component inside the window. 

    On Linux distribution, you can install it through software center, or download [source code](http://www.riverbankcomputing.com/software/pyqt/download5) and compile it by yourself.
    
    On MS Windows, you can install it via a [binary installer](http://www.riverbankcomputing.com/software/pyqt/download5)
        
* Kazoo package.

    Kazoo is a pure Python3 implemented ZooKeeper client.

    Install this package with this command: **python3 -m pip install kazoo**

# Run zkui
Start zkui with this command:  **python3 ./zkui.py**

The UI is composed with three parts:

* The top part is "navigation". It shows which node you are browsing. The "Go Up" and "Go Down" button is very helpful.
* The left part is "children and operations".  The blue blocks is the children of current node, click it to browse the child. The orange button has many useful operations, discover them by yourself.
* The right part is "node data". You can view and edit the node data here.
