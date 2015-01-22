from PyQt5 import QtCore, QtGui, QtWidgets, QtWebKitWidgets
from PyQt5.QtCore import QVariant, pyqtSlot
from PyQt5.QtGui import QPainter
from os.path import abspath
from kazoo.client import KazooClient
from kazoo.exceptions import *
import time
import logging
import json
import sys
import pathlib

class WebPage(QtWebKitWidgets.QWebPage):
	def __init__(self, parent=None):
		super(WebPage, self).__init__(parent)
		self.logger = logging
		logging.basicConfig(level=logging.INFO)
	def javaScriptConsoleMessage(self, msg, lineNumber, sourceID):
		self.logger.info(msg+"("+sourceID+":"+str(lineNumber)+")")

class WebWindow(object):
	def setupUi(self, Window):
		Window.setObjectName("Window")
		self.centralwidget = QtWidgets.QWidget(Window)
		self.centralwidget.setObjectName("centralwidget")
		self.verticalLayout = QtWidgets.QVBoxLayout(self.centralwidget)
		self.verticalLayout.setContentsMargins(0, 0, 0, 0)
		self.verticalLayout.setObjectName("verticalLayout")
		self.zk = None
		self.webView = QtWebKitWidgets.QWebView(self.centralwidget)
		self.webView.setObjectName("webView")
		self.webView.setRenderHint(QPainter.Antialiasing, True)
		self.webView.setRenderHint(QPainter.TextAntialiasing, True)
		self.webView.setRenderHint(QPainter.SmoothPixmapTransform, True)
		self.webView.setRenderHint(QPainter.HighQualityAntialiasing, True)
		self.webView.setPage(WebPage())
		frame = self.webView.page().mainFrame()
		frame.javaScriptWindowObjectCleared.connect(self.initJsComm)
		self.verticalLayout.addWidget(self.webView)
		Window.setCentralWidget(self.centralwidget)
		self.retranslateUi(Window)
		QtCore.QMetaObject.connectSlotsByName(Window)
	def retranslateUi(self, Window):
		_translate = QtCore.QCoreApplication.translate
		Window.setWindowTitle(_translate("Window", "Zookeeper GUI"))
	def loadLocalFile(self, file):
		self.webView.setUrl( QtCore.QUrl.fromLocalFile(abspath(sys.path[0]+'/'+file)) )
	def getCfgVar(self, name):
		cfg = {}
		file = None
		try:
			file = open(sys.path[0]+'/cfg.json','r')
			cfg = json.loads(file.read())
		except Exception as e:
			logging.info(str(e))
		finally:
			if file is not None:
				file.close()
		if name in cfg:
			return str(cfg[name])
		return ''
	def setCfgVar(self, name, value):
		cfg = {}
		file = None
		try:
			file = open(sys.path[0]+'/cfg.json','r')
			cfg = json.loads(file.read())
		except Exception as e:
			pass
		finally:
			if file is not None:
				file.close()
		cfg[name] = value
		file = None
		try:
			file = open(sys.path[0]+'/cfg.json','w')
			file.truncate()
			file.write(json.dumps(cfg))
		except Exception as e:
			logging.info(str(e))
		finally:
			if file is not None:
				file.close()
	def initJsComm(self):
		frame = self.webView.page().mainFrame()
		frame.addToJavaScriptWindowObject('py',self)
	@pyqtSlot(str,result=str)
	def jsGetCfg(self, name):
		return self.getCfgVar(name);
	@pyqtSlot(str,str)
	def jsSetCfg(self, name, value):
		self.setCfgVar(name, value);
	@pyqtSlot()
	def jsGetZk(self):
		return self.zk
	@pyqtSlot(result=int)
	def jsZkIsConnected(self):
		if self.zk is not None:
			return int(self.zk.state=='CONNECTED')
		return 0
	@pyqtSlot(str, result=str)
	def jsZkConnect(self,host):
		try:
			if self.zk is not None:
				#self.zk.remove_listener(self.onZkStateChange)
				self.zk.stop()
				self.zk.close()
			self.zk = KazooClient(hosts=host)
			#self.zk.add_listener(self.onZkStateChange)
			self.zk.start(6)
		except KazooException as e:
			return "Zookeeper Error: "+str(e)
		except Exception as e:
			return str(e)
		return ''
	#def onZkStateChange(self,state):
	#	frame = self.webView.page().mainFrame()
	#	frame.evaluateJavaScript("onPyZkStateChange('"+state+"')")
	@pyqtSlot(str, result=QVariant)
	def jsZkGetChildren(self, path):
		try:
			logging.info("jsZkGetChildren, path="+path)
			children = self.zk.get_children(path)
		except NoNodeError as e:
			logging.info("jsZkGetChildren, NoNodeError")
			return QVariant({"err":"node not exists"})
		except ZookeeperError as e:
			logging.info("jsZkGetChildren, ZookeeperError")
			return QVariant({"err":str(e)})
		return QVariant({"err":"", "children":children})
	@pyqtSlot(str, result=QVariant)
	def jsZkGet(self, path):
		try:
			logging.info("jsZkGet, path="+path)
			ret = self.zk.get(path)
		except NoNodeError as e:
			logging.info("jsZkGet, NoNodeError")
			return QVariant({"err":"node not exists"})
		except ZookeeperError as e:
			logging.info("jsZkGet, ZookeeperError")
			return QVariant({"err":str(e)})
		ctime = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(ret[1].ctime/1000))
		mtime = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(ret[1].mtime/1000))
		stat = {'ctime':ctime,'mtime':mtime,'version':ret[1].version}
		return QVariant({"err":"", "data":ret[0].decode('utf8'), "stat":QVariant(stat)})
	@pyqtSlot(str, str, int, result=str)
	def jsZkSet(self, path, data, ver):
		try:
			logging.info("jsZkSet, path="+path+',ver='+str(ver))
			self.zk.set(path, bytes(data, 'utf8'),ver)
		except NoNodeError as e:
			logging.info("jsZkSet, NoNodeError")
			return "node not exists"
		except BadVersionError as e:
			logging.info("jsZkSet, BadVersionError")
			return "bad version"
		except ZookeeperError as e:
			logging.info("jsZkSet, ZookeeperError")
			return str(e)
		return ''
	@pyqtSlot(str, result=QVariant)
	def jsZkGetAcl(self, path):
		try:
			logging.info("jsZkGetAcl, path="+path)
			ret = self.zk.get_acls(path)
		except NoNodeError as e:
			logging.info("jsZkGetAcl, NoNodeError")
			return QVariant({"err":"node not exists"})
		except ZookeeperError as e:
			logging.info("jsZkGetAcl, ZookeeperError")
			return QVariant({"err":str(e)})
		lst = []
		for acl in ret[0]:
			dacl = {"perms":acl.perms,'scheme':acl.id.scheme,'digest':acl.id.id}
			lst.append(QVariant(dacl))
		stat = {'ctime':ret[1].ctime,'mtime':ret[1].mtime,'version':ret[1].version}
		return QVariant({"err":"", "acl_list":QVariant(lst), "stat":QVariant(stat)})
	@pyqtSlot(str,str,int,int,result=str)
	def jsZkCreate(self, path, data, ephem, seq):
		try:
			logging.info("jsZkCreate, path="+path)
			self.zk.create(path=path, value=bytes(data,'utf8'), ephemeral=bool(ephem), sequence=bool(seq))
		except NoNodeError as e:
			logging.info("jsZkCreate, NoNodeError")
			return "node not exists"
		except NodeExistsError as e:
			logging.info("jsZkCreate, NodeExistsError")
			return "node already exists"
		except NoChildrenForEphemeralsError as e:
			logging.info("jsZkCreate, NoChildrenForEphemeralsError")
			return "ephemeral node can not have child"
		except ZookeeperError as e:
			logging.info("jsZkCreate, ZookeeperError")
			return str(e)
		return ''
	@pyqtSlot(str, int, int, result=str)
	def jsZkDelete(self, path, ver, recursive):
		try:
			logging.info("jsZkDelete, path="+path+',ver='+str(ver)+', recursive='+str(recursive))
			self.zk.delete(path, ver, bool(recursive))
		except NoNodeError as e:
			logging.info("jsZkDelete, NoNodeError")
			return "node not exists"
		except BadVersionError as e:
			logging.info("jsZkDelete, BadVersionError")
			return "bad version"
		except NotEmptyError as e:
			logging.info("jsZkDelete, NotEmptyError")
			return "node not empty"
		except ZookeeperError as e:
			logging.info("jsZkDelete, ZookeeperError")
			return str(e)
		return ''
	@pyqtSlot(str, str, int, int, result=str)
	def jsZkCopy(self, dest_path, ori_path, max_depth, children_only):
		logging.info("jsZkCopy, dest_path="+dest_path+", ori_path="+ori_path+", children_only="+str(children_only))
		#copy node first
		if children_only==0:
			try:
				ori_data = self.zk.get(ori_path)
				if self.zk.exists(dest_path) is None:
					self.zk.create(dest_path, ori_data[0])
				else:
					self.set(dest_path, ori_data[0])
			except NoNodeError as e:
				logging.info("jsZkCopy, node, NoNodeError, ori_path="+ori_path+', dest_path='+dest_path)
				return "node not exists"
			except ZookeeperError as e:
				logging.info("jsZkCopy, node, ZookeeperError")
				return str(e)
			except Exception as e:
				return 'exception, '+str(e)
		#copy children
		path = ''
		try:
			max_depth -= 1;
			path = ori_path
			ori_children = self.zk.get_children(ori_path)
			for child in ori_children:
				path = ori_path+'/'+child
				ret = self.jsZkCopy(dest_path+'/'+child, ori_path+'/'+child, max_depth, 0)
				if isinstance(ret, QVariant):
					return ret
				elif len(ret)>0:
					return ret
		except NoNodeError as e:
			logging.info("jsZkCopy, child, NoNodeError")
			return "node not exists, path="+path
		except ZookeeperError as e:
			logging.info("jsZkCopy, child, ZookeeperError")
			return str(e)+', path='+path
		except Exception as e:
			return 'exception, '+str(e)
		return ''
	'''
	@pyqtSlot(str, str, int, result=str)
	def jsZkCopyChildren(self, dest_path, ori_path, max_depth):
		path = ''
		try:
			max_depth -= 1;
			logging.info("jsZkCopyChildren, dest_path="+dest_path+", ori_path="+ori_path)
			path = ori_path
			ori_children = self.zk.get_children(ori_path)
			path = dest_path
			dest_children = self.zk.get_children(dest_path)
			for child in ori_children:
				if child in dest_children:
					return 'child ['+child+'] is found in both path'
			for child in ori_children:
				path = ori_path+'/'+child
				data = self.zk.get(path)[0]
				path = dest_path+'/'+child
				self.zk.create(path, data)
				if max_depth>0:
					ret = self.jsZkCopyChildren(dest_path+'/'+child, ori_path+'/'+child, max_depth)
					if len(ret)>0:
						return ret
		except NoNodeError as e:
			logging.info("jsZkCopyChildren, NoNodeError")
			return "node not exists, path="+path
		except ZookeeperError as e:
			logging.info("jsZkCopyChildren, ZookeeperError")
			return str(e)+', path='+path
		return ''
	'''
	@pyqtSlot(str, int, result=str)
	def jsZkDeleteChildren(self, main_path, max_depth):
		path = ''
		try:
			max_depth -= 1;
			path = main_path
			logging.info("jsZkDeleteChildren, path="+main_path)
			children = self.zk.get_children(path)
			for child in children:
				path = main_path+'/'+child
				if max_depth>0:
					ret = self.jsZkDeleteChildren(path, max_depth)
					if len(ret)>0:
						return ret
				self.zk.delete(path)
		except NoNodeError as e:
			logging.info("jsZkDeleteChildren, NoNodeError")
			return "node not exists, path="+path
		except ZookeeperError as e:
			logging.info("jsZkDeleteChildren, ZookeeperError")
			return str(e)+', path='+path
		except Exception as e:
			return 'exception, '+str(e)
		return ''
	@pyqtSlot(str, str, int, result=str)
	def jsZkExport(self, local_dir, main_path, max_depth):
		path = ''
		try:
			max_depth -= 1;
			path = main_path
			logging.info("jsZkExport, path="+main_path+' to local dir '+local_dir)
			data = self.zk.get(main_path)
			p = pathlib.Path(local_dir)
			if not p.exists():
				p.mkdir(parents=True)
			elif not p.is_dir():
				return 'local '+local_dir+' exists, but not a directory';
			for child in p.iterdir():
				return 'local path '+local_dir+' is not empty, clear it first'
			p = pathlib.Path(local_dir+'/____data')
			p.touch()
			obj = open(str(p),'wb')
			try:
				obj.write(data[0])
			finally:
				obj.close()
			children = self.zk.get_children(path)
			for child in children:
				if child=='zookeeper':
					continue
				path = main_path+'/'+child
				if max_depth>0:
					ret = self.jsZkExport(local_dir+'/'+child, path, max_depth)
					if len(ret)>0:
						return ret
		except NoNodeError as e:
			logging.info("jsZkExport, NoNodeError")
			return "node not exists, path="+path
		except ZookeeperError as e:
			logging.info("jsZkExport, ZookeeperError")
			return str(e)+', path='+path
		except Exception as e:
			return 'exception, '+str(e)
		return ''
	@pyqtSlot(str, str, int, result=str)
	def jsZkImport(self, local_dir, main_path, max_depth):
		path = ''
		try:
			max_depth -= 1;
			path = main_path
			logging.info("jsZkImport, path="+main_path+' from local dir '+local_dir)
			obj = open(local_dir+'/____data', 'rb')
			if self.zk.exists(path) is None:
				self.zk.create(path, obj.read())
			else:
				self.zk.set(path, obj.read())
			p = pathlib.Path(local_dir)
			for child in p.iterdir():
				if not child.is_dir():
					continue
				if child.name=='zookeeper':
					continue
				ret = self.jsZkImport(str(child), path+'/'+child.name, max_depth)
				if len(ret)>0:
					return ret
		except NoNodeError as e:
			logging.info("jsZkImport, NoNodeError")
			return "node not exists, path="+path
		except ZookeeperError as e:
			logging.info("jsZkImport, ZookeeperError")
			return str(e)+', path='+path
		#except Exception as e:
		#	return 'exception, '+str(e)
		return ''
