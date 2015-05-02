from PyQt5 import QtCore, QtWidgets, QtWebKitWidgets, QtNetwork, QtWebKit, QtPrintSupport
from PyQt5.QtCore import QVariant, pyqtSlot
from PyQt5.QtGui import QPainter
import os
import os.path
from kazoo.client import KazooClient
from kazoo.exceptions import NoNodeError, ZookeeperError, NodeExistsError, BadVersionError, KazooException, NoChildrenForEphemeralsError, InvalidACLError, NotEmptyError
import kazoo.security
import time
import logging
import json
import sys
import pathlib
import hashlib
import base64
import traceback
import yaml

class WebPage(QtWebKitWidgets.QWebPage):
	def __init__(self, parent=None):
		super(WebPage, self).__init__(parent)
		self.logger = logging
		logging.basicConfig(level=logging.ERROR)
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
		self.loadDefaultAcl()
	def retranslateUi(self, Window):
		_translate = QtCore.QCoreApplication.translate
		Window.setWindowTitle(_translate("Window", "Zookeeper GUI"))
	def loadLocalFile(self, filename):
		localdir = os.path.abspath(sys.path[0])
		if os.path.isfile(localdir):
			localdir = os.path.dirname(localdir)
		self.webView.setUrl( QtCore.QUrl.fromLocalFile(localdir+'/'+filename) )
	def getCfgVar(self, name):
		localdir = os.path.abspath(sys.path[0])
		if os.path.isfile(localdir):
			localdir = os.path.dirname(localdir)
		cfg = {}
		obj = None
		try:
			obj = open(localdir+'/cfg.json','r')
			cfg = json.loads(obj.read())
		except Exception as e:
			logging.info(str(e))
		finally:
			if obj is not None:
				obj.close()
		if name in cfg:
			return str(cfg[name])
		return ''
	def setCfgVar(self, name, value):
		localdir = os.path.abspath(sys.path[0])
		if os.path.isfile(localdir):
			localdir = os.path.dirname(localdir)
		cfg = {}
		obj = None
		try:
			obj = open(localdir+'/cfg.json','r')
			cfg = json.loads(obj.read())
		except Exception as e:
			pass
		finally:
			if obj is not None:
				obj.close()
		cfg[name] = value
		obj = None
		try:
			obj = open(localdir+'/cfg.json','w')
			obj.truncate()
			obj.write(json.dumps(cfg))
		except Exception as e:
			logging.info(str(e))
		finally:
			if obj is not None:
				obj.close()
	def makeDigestCred(self, user, plain_pass):
		m = hashlib.sha1( bytes(user,'utf8') + b':' + bytes(plain_pass,'utf8') ).digest()
		return user+':'+base64.b64encode(m).strip().decode('utf8')
	def initJsComm(self):
		frame = self.webView.page().mainFrame()
		frame.addToJavaScriptWindowObject('py',self)
	@pyqtSlot(str)
	def jsSetWinTitle(self, title):
		_translate = QtCore.QCoreApplication.translate
		self.setWindowTitle(_translate("Window", title))
	@pyqtSlot(str, result=str)
	def jsCheckYaml(self, s):
		try:
			a = yaml.load(s)
		except Exception as e:
			return str(e)
		if a is None:
			return 'Failed'
		return ''
	@pyqtSlot(str,result=str)
	def jsGetCfg(self, name):
		return self.getCfgVar(name)
	@pyqtSlot(str,str)
	def jsSetCfg(self, name, value):
		self.setCfgVar(name, value)
	def loadDefaultAcl(self):
		self.updateDefaultAclCache( self.getCfgVar('defaultacl') )
	def updateDefaultAclCache(self, list_str):
		if list_str is not None and len(list_str)>0:
			cache = json.loads(list_str)
			self.default_acl_plain = []
			self.default_acl = []
			for one in cache:
				if(one['scheme']=='world'):
					self.default_acl_plain.append(one)
					acl = kazoo.security.ACL( one['perm'], kazoo.security.Id('world', 'anyone') )
					self.default_acl.append(acl)
				elif(one['scheme']=='digest'):
					self.default_acl_plain.append(one)
					if 'id' in one:
						acl = kazoo.security.ACL( one['perm'], kazoo.security.Id('digest', one['id']) )
					else:
						acl = kazoo.security.ACL( one['perm'], kazoo.security.Id('digest', self.makeDigestCred(one['user'],one['pass'])) )
					self.default_acl.append(acl)
				elif(one['scheme']=='ip'):
					self.default_acl_plain.append(one)
					acl = kazoo.security.ACL( one['perm'], kazoo.security.Id('ip', one['ip']) )
					self.default_acl.append(acl)
		else:
			self.default_acl_plain = []
			self.default_acl = None
	@pyqtSlot(str,result=str)
	def jsSetDefaultAcl(self, list_str):
		self.updateDefaultAclCache(list_str)
		self.setCfgVar('defaultacl', json.dumps(self.default_acl_plain))
	@pyqtSlot(result=str)
	def jsGetDefaultAcl(self):
		return json.dumps(self.default_acl_plain)
	@pyqtSlot()
	def jsGetZk(self):
		return self.zk
	@pyqtSlot(result=int)
	def jsZkIsConnected(self):
		if self.zk is not None:
			return int(self.zk.state=='CONNECTED')
		return 0
	@pyqtSlot(str, str, result=str)
	def jsZkConnect(self,host, auth_list_str):
		try:
			if self.zk is not None:
				#self.zk.remove_listener(self.onZkStateChange)
				self.zk.stop()
				self.zk.close()
			self.zk = KazooClient(hosts=host)
			#self.zk.add_listener(self.onZkStateChange)
			self.zk.start(15)
			auth_list = json.loads(auth_list_str)
			for one in auth_list:
				cred = self.makeDigestCred(one['user'], one['pass'])
				self.zk.add_auth('digest', one['user']+':'+one['pass'])
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
		except NoNodeError:
			logging.info("jsZkGetChildren, NoNodeError")
			return QVariant({"err":"node not exists"})
		except ZookeeperError as e:
			logging.info("jsZkGetChildren, ZookeeperError")
			t = sys.exc_info()[0]
			return QVariant({"err":str(t)+str(e)})
		except Exception as e:	
			return 'exception, '+str(e)
		return QVariant({"err":"", "children":children})
	@pyqtSlot(str, result=QVariant)
	def jsZkGet(self, path):
		try:
			logging.info("jsZkGet, path="+path)
			ret = self.zk.get(path)
		except NoNodeError:
			logging.info("jsZkGet, NoNodeError")
			return QVariant({"err":"node not exists"})
		except ZookeeperError as e:
			logging.info("jsZkGet, ZookeeperError")
			t = sys.exc_info()[0]
			return QVariant({"err":str(t)+str(e)})
		except Exception as e:	
			return 'exception, '+str(e)
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
			t = sys.exc_info()[0]
			return str(t)+str(e)
		except Exception as e:	
			return 'exception, '+str(e)
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
			t = sys.exc_info()[0]
			return QVariant({"err":str(t)+str(e)})
		except Exception as e:
			return 'exception, '+str(e)
		lst = []
		for acl in ret[0]:
			dacl = {"perm":acl.perms,'scheme':acl.id.scheme,'id':acl.id.id}
			lst.append(QVariant(dacl))
		stat = {'ctime':ret[1].ctime,'mtime':ret[1].mtime,'version':ret[1].version}
		return QVariant({"err":"", "acl_list":QVariant(lst), "stat":QVariant(stat)})
	@pyqtSlot(str, str, result=str)
	def jsZkSetAcl(self, path, list_str):
		try:
			acl_list = None
			if list_str is not None and len(list_str)>0:
				cache = json.loads(list_str)
				acl_list = []
				for one in cache:
					if(one['scheme']=='world'):
						acl = kazoo.security.ACL( one['perm'], kazoo.security.Id('world', 'anyone') )
						acl_list.append(acl)
					elif(one['scheme']=='digest'):
						if 'id' in one:
							acl = kazoo.security.ACL( one['perm'], kazoo.security.Id('digest', one['id']) )
						else:
							acl = kazoo.security.ACL( one['perm'], kazoo.security.Id('digest', self.makeDigestCred(one['user'],one['pass'])) )
						acl_list.append(acl)
					elif(one['scheme']=='ip'):
						acl = kazoo.security.ACL( one['perm'], kazoo.security.Id('ip', one['ip']) )
						acl_list.append(acl)
			self.zk.set_acls(path, acl_list)
		except NoNodeError as e:
			logging.info("jsZkSetAcl, NoNodeError")
			return "node not exists"
		except InvalidACLError as e:
			logging.info("jsZkSetAcl, InvalidACLError")
			t,v,tb = sys.exc_info()
			print(str(e))
			traceback.print_tb(tb)
			return "invalid acl"
		except BadVersionError as e:
			logging.info("jsZkSetAcl, BadVersionError")
			return "bad version error"
		except ZookeeperError as e:
			logging.info("jsZkSetAcl, ZookeeperError")
			t,v,tb = sys.exc_info()
			return str(t)+str(e)
		except Exception as e:
			return 'exception, '+str(e)
		return ''
	@pyqtSlot(str,str,int,int,result=str)
	def jsZkCreate(self, path, data, ephem, seq):
		try:
			logging.info("jsZkCreate, path="+path)
			print(self.default_acl)
			self.zk.create(path=path, value=bytes(data,'utf8'), ephemeral=bool(ephem), sequence=bool(seq))
			self.zk.set_acls(path, self.default_acl)
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
			t = sys.exc_info()[0]
			return str(t)+str(e)
		except Exception as e:
			return 'exception, '+str(e)
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
			t = sys.exc_info()[0]
			return str(t)+str(e)
		except Exception as e:
			return 'exception, '+str(e)
		return ''
	@pyqtSlot(str, str, int, int, result=str)
	def jsZkCopy(self, dest_path, ori_path, max_depth, children_only):
		logging.info("jsZkCopy, dest_path="+dest_path+", ori_path="+ori_path+", children_only="+str(children_only))
		#copy node first
		if children_only==0:
			try:
				ori_data = self.zk.get(ori_path)
				if self.zk.exists(dest_path) is None:
					self.zk.create(dest_path, ori_data[0], acl=self.default_acl)
				else:
					self.zk.set(dest_path, ori_data[0])
			except NoNodeError as e:
				logging.info("jsZkCopy, node, NoNodeError, ori_path="+ori_path+', dest_path='+dest_path)
				return "node not exists"
			except ZookeeperError as e:
				logging.info("jsZkCopy, node, ZookeeperError")
				t = sys.exc_info()[0]
				return str(t)+str(e)
			except Exception as e:
				return 'exception, '+str(e)
		#copy children
		path = ''
		try:
			max_depth -= 1
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
			t = sys.exc_info()[0]
			return str(t)+str(e)+', path='+path
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
				self.zk.create(path, data, acl=self.default_acl)
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
			max_depth -= 1
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
			t = sys.exc_info()[0]
			return str(t)+str(e)+', path='+path
		except Exception as e:
			return 'exception, '+str(e)
		return ''
	@pyqtSlot(str, str, int, int, result=str)
	def jsZkExport(self, local_dir, main_path, max_depth, without_acl):
		path = ''
		try:
			max_depth -= 1
			path = main_path
			logging.info("jsZkExport, path="+main_path+' to local dir '+local_dir)
			data = self.zk.get(main_path)
			p = pathlib.Path(local_dir)
			if not p.exists():
				p.mkdir(parents=True)
			elif not p.is_dir():
				return 'local '+local_dir+' exists, but not a directory'
			for child in p.iterdir():
				return 'local path '+local_dir+' is not empty, clear it first'
			p = pathlib.Path(local_dir+'/____data')
			p.touch()
			obj = open(str(p),'wb')
			try:
				obj.write(data[0])
			finally:
				obj.close()
			if not without_acl:
				ret = self.zk.get_acls(path)
				lst = []
				for acl in ret[0]:
					lst.append( {"perm":acl.perms,'scheme':acl.id.scheme,'id':acl.id.id} )
				p = pathlib.Path(local_dir+'/____acl')
				p.touch()
				obj = open(str(p),'w')
				try:
					obj.write(json.dumps(lst))
				finally:
					obj.close()
			children = self.zk.get_children(path)
			for child in children:
				if child=='zookeeper':
					continue
				path = main_path+'/'+child
				if max_depth>0:
					ret = self.jsZkExport(local_dir+'/'+child, path, max_depth, without_acl)
					if len(ret)>0:
						return ret
		except NoNodeError as e:
			logging.info("jsZkExport, NoNodeError")
			return "node not exists, path="+path
		except ZookeeperError as e:
			logging.info("jsZkExport, ZookeeperError")
			t = sys.exc_info()[0]
			return str(t)+str(e)+', path='+path
		except Exception as e:
			return 'exception, '+str(e)
		return ''
	@pyqtSlot(str, str, int, int, result=str)
	def jsZkImport(self, local_dir, main_path, max_depth, without_acl):
		path = ''
		try:
			max_depth -= 1
			path = main_path
			logging.info("jsZkImport, path="+main_path+' from local dir '+local_dir)
			obj = open(local_dir+'/____data', 'rb')
			if self.zk.exists(path) is None:
				self.zk.create(path, obj.read(), acl=self.default_acl)
			else:
				self.zk.set(path, obj.read())
			if not without_acl:
				obj = open(local_dir+'/____acl', 'r')
				acl_list = None
				list_str = obj.read()
				if list_str is not None and len(list_str)>0:
					cache = json.loads(list_str)
					acl_list = []
					for one in cache:
						acl = kazoo.security.ACL( one['perm'], kazoo.security.Id(one['scheme'], one['id']) )
						acl_list.append(acl)
					self.zk.set_acls(path, acl_list)
			p = pathlib.Path(local_dir)
			for child in p.iterdir():
				if not child.is_dir():
					continue
				if child.name=='zookeeper':
					continue
				ret = self.jsZkImport(str(child), path+'/'+child.name, max_depth, without_acl)
				if len(ret)>0:
					return ret
		except NoNodeError as e:
			logging.info("jsZkImport, NoNodeError")
			return "node not exists, path="+path
		except ZookeeperError as e:
			logging.info("jsZkImport, ZookeeperError")
			t = sys.exc_info()[0]
			return str(t)+str(e)+', path='+path
		except Exception as e:
			return 'exception, '+str(e)
		return ''
