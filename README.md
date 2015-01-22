# zkui
zkui is a GUI client implemented with Python3 + Qt5 + HTML5.

#features
* Browse the node tree, edit the node's data.
* Copy a node to new path **recursively**.
* Export/Import between node and your local storage **recursively**.
* Delete node and its children  **recursively**.

#features not supported yet
* ACL is not supported yet, zkui can only use "world" currentlly.

#cross OS problem
* I only test and use zkui on my Ubuntu 14.04 X64 PC.
* On MS Windows, multibyte charactors are messy. I an new to Python3 and need help to solve this.
* On MS Windows, the official Kazoo release is buggy, you have to use my modified version. I will upload this on github soon.

# requirement

* Python3.x

* * The latest version is 3.4.2 as Ｉwrite this. This is also the recommended version. [download here](http://http://python.org/)

* * PyQt5 package. 

        We use PyQt5 to draw the native window and use its QWebkit to render all the gui component inside the window. 
        Install this package with this command:  **python3 -m pip install pyqt5**
        
* * Kazoo package.

        Kazoo is a pure Python3 implemented ZooKeeper client.
        Install this package with this command: **python3 -m pip install kazoo**

# run zkui
Start zkui with this command:  **python3 ./zkui.py**

The UI is composed with three parts:

* The top part is "navigation". It shows which node you are browsing. The "Go Up" and "Go Down" button is very helpful.
* The left part is "children and operations".  The blue blocks is the children of current node, click it to browse the child. The orange button has many useful operations, discover them by yourself.
* The right part is "node data". You can view and edit the node data here.
