#!/usr/bin/python3

import sys
from PyQt5.QtWidgets import QApplication, QMainWindow
from WebWindow import WebWindow

class Window(QMainWindow, WebWindow):
	def __init__(self, parent=None):
		super(Window, self).__init__(parent)
		self.setupUi(self)
	def loadLocalFile(self, file):
		super(Window, self).loadLocalFile(file)
	def on_webView_loadFinished(self):
		pass

app = QApplication(sys.argv)

window = Window()
window.show()
window.resize(950,600)
window.setMinimumWidth(950)
window.setMinimumHeight(600)
window.loadLocalFile('login.html')

sys.exit(app.exec_())