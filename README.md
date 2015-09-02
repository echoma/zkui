# zkui
zkui is a GUI frontend of [Apache ZooKeeper](http://zookeeper.apache.org/) implemented with Python3 + Qt5 + HTML5.

*A screenshot on Xubuntu 15.04*
![The Main Window](https://github.com/echoma/zkui/wiki/snapshot_20150122/02_create_child_xubuntu.JPG)

[Check Here For More Screenshots](https://github.com/echoma/zkui/wiki/Snapshots)

# Features
* Browse the ZooKeeper node tree, edit the node's data.
* Copy a node to new path recursively.
* Export / Import between node and your local storage recursively.
* Delete node and its children  recursively.
* ACL supportted, sheme including world,digest,ip
* Use a pre-configured default ACL when create new node
* Cross-platform, this is the nature given by Python3 and Qt5

# Download Pre-built Binaries

If it's too complicated for you to build a Python3+PyQt5 environment, You can [download pre-built binary executables here](https://github.com/echoma/zkui/wiki/Download).

* Currently, there are only MS Windows executables provided.
* The latest binary package is uploaded on 2015-09-02

# Build By Yourself

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

# Freeze Python Scripts Into Binaries

### Install Python3's cx_Freeze package.

* cx_Freeze is a set of cross platform tools which can freeze Python scripts into executables.

* Install this package with this commad: **python3 -m pip install cx_Freeze**

### On MS-Windows

* build executables: **python3 ./cx_freeze_setup.py build**

* build MS Installer: **python3 ./cx_freeze_setup.py bdist_msi**

### On Linux

* build RPM *(not tested)*: **python3 ./cx_freeze_setup.py bdist_rpm**

### On Mac OSX

* build DMG: **python3 ./cx_freeze_setup.py bdist_dmg**

# Simple Usage Guidance
The whole UI is composed with three parts:

* The top part is "navigation". It shows which node you are browsing. The "Go Up" and "Go Down" button is very helpful.
* The left part is "children and operations".  The blue blocks is the children of current node, click it to browse the child. The orange button has many useful operations, discover them by yourself.
* The right part is "node data". You can view and edit the node data here.

# Miscellaneous
* I choose Apache License v2, but I am not an expert on license. Zkui uses many other opensource modules, I am not sure whether Apache Licese v2 is legal.