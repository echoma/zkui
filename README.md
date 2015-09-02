# zkui
zkui is a GUI frontend of [Apache ZooKeeper](http://zookeeper.apache.org/) implemented with Python3 + Qt5 + HTML5.

Here are some [screenshots](https://github.com/echoma/zkui/wiki/Snapshots)

# Features
* Browse the ZooKeeper node tree, edit the node's data.
* Copy a node to new path recursively.
* Export / Import between node and your local storage recursively.
* Delete node and its children  recursively.
* ACL supportted, sheme including world,digest,ip
* Use a pre-configured default ACL when create new node
* Cross-platform, this is the nature given by Python3 and Qt5

# Download

You can [download pre-built binary executables here](https://github.com/echoma/zkui/wiki/Download).

> Currently, there are only MS Windows executables provided.

> I am having problem to freeze zkui into binary executables with cx_Freeze on my Ubuntu 14.04. I will appreciate it that if someone could help me on this.**

# Build By yourself

### 1. Install Python3.x

* The latest version is 3.4.3 as Ｉwrite this. This is also the recommended version. [download it here](http://python.org/)

* Install PyQt5 package. 

    We use PyQt5 to draw the native window and use its QWebkit to render all the gui component inside the window. 

    On Linux distribution, you can install it through software center, or download [source code](http://www.riverbankcomputing.com/software/pyqt/download5) and compile it by yourself.
    
    On MS Windows, you can install it via a [binary installer](http://www.riverbankcomputing.com/software/pyqt/download5)
        
* Install Kazoo package.

    Kazoo is a pure Python3 implemented ZooKeeper client.

    Install this package with this command: **python3 -m pip install kazoo**

### 2. Run zkui

* Start zkui with this command:  **python3 ./zkui.py**

### 3. Freeze

* Install Python3's cx_Freeze package.

    cx_Freeze is a set of cross platform tools which can freeze Python scripts into executables.
	
	Install this package with this commad: **python3 -m pip install cx_Freeze**

* Freeze On MS-Windows: **python3 ./cx_freeze_setup.py bdist_msi**

* Freeze On Linux: **python3 ./cx_freeze_setup.py bdist_rpm**

* Freeze On Mac OSX: **python3 ./cx_freeze_setup.py bdist_dmg**

# Simple Usage Guidance
The whole UI is composed with three parts:

* The top part is "navigation". It shows which node you are browsing. The "Go Up" and "Go Down" button is very helpful.
* The left part is "children and operations".  The blue blocks is the children of current node, click it to browse the child. The orange button has many useful operations, discover them by yourself.
* The right part is "node data". You can view and edit the node data here.

# Miscellaneous
* My colleague and I mainly test and use zkui on **Ubuntu Linux 14.04/15.04 X64** and **MS Windows 7**, so there may be some unkown bugs on other OS.
* I choose Apache License v2, but I am not an expert on license. Zkui uses many other opensource modules, I am not sure whether Apache Licese v2 is legal.