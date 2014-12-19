ZooKeeper = require ("zookeeper");
_gzk = null;
_gpath = '/';
$(document).ready(
	function()
	{
		var tmr = new Timer(5.0, zkuiEnsureConnection);
		tmr.start();
		zkuiEnsureConnection();

		$('#stat_copy_path').on('click',function(e){
			var gui = require('nw.gui');
			var clipboard = gui.Clipboard.get();
			clipboard.set($('#stat_path').val(), 'text');
		});

		$('#create_child_dialog').draggable({handle:'#create_child_dialog .modal-header'})
	}
);
function myalert(text)
{
	alert(text);
}
function zkuiEnsureConnection()
{
	if(!empty(_gzk))
	{
		if(_gzk.state==ZooKeeper.ZOO_CONNECTED_STATE)
			return;
		_gzk.close();
		_gzk = null;
	}
	var host = getCookie('zkhost');
	var oatype = getCookie('zkauthtype');
	var oaval = getCookie('zkauthval');
	_gzk = new ZooKeeper({connect:host,timeout:200000,debug_level:ZooKeeper.ZOO_LOG_LEVEL_DEBUG});
	_gzk.connect(function(err){
		if(err)
		{
			myalert('ZooKeeper connect failed, err='+err);
			return;
		}
		_gzk.on('close', function(){
			_gzk.close();
			_gzk = null;
		});
		zkuiRefreshPath();
	});
}
function zkuiRefreshPath(path)
{
	if(!empty(path))
		_gpath = path;
	if(empty(_gzk))
		return;
	log("refreshing path = " + _gpath);
	_gzk.a_get_children(_gpath,0,function(rc,err,list){
		if(0!=rc)
		{
			myalert("get_children("+path+") failed, err="+err);
			return;
		}
		zkuiNavBreadUpdate();
		zkuiChildrenUpdate(list);
	});
	_gzk.a_get(_gpath,0,function(rc,err,stat,data){
		if(0!=rc)
		{
			myalert("get("+path+") failed, err="+err);
			return;
		}
		zkuiStatUpdate(stat);
		zkuiValueUpdate(data);
	});
	_gzk.a_get_acl(_gpath,function(rc,err,acl_list,stat){
		if(0!=rc)
		{
			myalert("get_acl("+path+") failed, err="+err);
			return;
		}
		zkuiAclUpdate(acl_list);
	});
}
function zkuiGo(dir)
{
	if(dir<0)
	{
		var p = _gpath.lastIndexOf('/');
		var path = _gpath.substring(0,p);
		if(empty(path))
			path = '/';
		zkuiRefreshPath(path);
	}
	else
	{
		var p = _gpath_max.indexOf('/',_gpath.length+1);
		if(p>0)
		{
			var path = _gpath_max.substring(0,p);
			zkuiRefreshPath(path);
		}
		else
		{
			zkuiRefreshPath(_gpath_max)
		}
	}
}
_gpath_max = '/';
function zkuiNavBreadUpdate()
{
	var bread_path = _gpath;
	if(0==_gpath_max.indexOf(_gpath))
		bread_path = _gpath_max;
	else
		_gpath_max = bread_path;
	var _arr = bread_path.split('/');
	var arr = new Array();
	arr.push('/');
	for(var i=0; i<_arr.length; ++i)
	{
		if(!empty(_arr[i]))
			arr.push(_arr[i]);
	}
	var dom = $('#nav_bread');
	dom.find('[name=real]').remove();
	var spl = dom.find('[name=sample]');
	var splact = dom.find('[name=sample_active]');
	var step = '';
	for(var i=0; i<arr.length; ++i)
	{
		if(i>1)
			step += '/';
		step += arr[i];
		var d, isact = 0;
		if(step==_gpath)
		{
			d = splact.clone().removeClass('hidden');
			isact = 1;
		}
		else
			d = spl.clone().removeClass('hidden');
		d.attr('name','real').attr('path',step);
		var txt = arr[i];
		if(step=='/')
			txt = 'ROOT';
		if(isact)
			d.text(txt);
		else
			d.find('a').text(txt).attr('href','javascript:zkuiRefreshPath("'+step+'")');
		dom.append(d);
	}
}
function zkuiChildrenUpdate(list)
{
	list.sort(function(a,b){if(a<b)return -1; else if(a>b) return 1; return 0;});
	var dom=$('#chld_list');
	dom.find('[name=real]').remove();
	var spl = dom.find('[name=sample]');
	for(var i=0; i<list.length; ++i)
	{
		var path = _gpath;
		if(path=='/')
			path += list[i];
		else
			path += '/'+list[i];
		var d = spl.clone().removeClass('hidden').attr('name','real').attr('path', path)
			.text(list[i]).attr('href','javascript:zkuiRefreshPath("'+path+'")');
		dom.append(d);
	}
}
function zkuiStatUpdate(stat)
{
	$('#stat_path').val(_gpath);
	$('#stat_version').val(stat.version);
	$('#stat_ctime').val(stat.ctime);
	$('#stat_mtime').val(stat.mtime);
}
function zkuiValueUpdate(data)
{
	if(typeof(data)=='string')
		$('#node_value').text(data);
	else
		$('#node_value').text(data.toString());
}
function zkuiAclUpdate(acl_list)
{
	var dom = $('#node_misc_prop');
	dom.find('[name=acl_real]').remove();
	var spl = dom.find('[name=acl_sample]');
	for(var i=0; i<acl_list.length; ++i)
	{
		var acl=acl_list[i], perm_str='';
		if(acl.perms&ZooKeeper.ZOO_PERM_ALL)
			perm_str+='ALL';
		else
		{
			if(acl.perms&ZooKeeper.ZOO_PERM_READ)
				perm_str+='r';
			if(acl.perms&ZooKeeper.ZOO_PERM_WRITE)
				perm_str+='w';
			if(acl.perms&ZooKeeper.ZOO_PERM_CREATE)
				perm_str+='c';
			if(acl.perms&ZooKeeper.ZOO_PERM_DELETE)
				perm_str+='d';
			if(acl.perms&ZooKeeper.ZOO_PERM_ADMIN)
				perm_str+='a';
		}
		var d = spl.clone().removeClass('hidden').attr('name','acl_real');
		d.find('input').val(perm_str+'@'+acl.scheme+'@'+acl.auth);
		dom.append(d);
	}
}

function showCreateChildDialog()
{
	var dlg = $('#create_child_dialog');
	dlg.modal({backdrop:false}).draggable({handle: ".modal-header"});
	setTimeout("$('#create_child_dlg_name').focus().select();",100);
	$('#create_child_dlg_data').val('');
}
function ensureCreateChild()
{
	var dlg = $('#create_child_dialog');
	var name=$('#create_child_dlg_name').val();
	var data=$('#create_child_dlg_data').val();
	var ephe=$('#create_child_dlg_ephemeral:checked').length>0?1:0;
	var sque=$('#create_child_dlg_sequence:checked').length>0?1:0;
	var goac=$('#create_child_dlg_go:checked').length>0?1:0;
	var clac=$('#create_child_dlg_close:checked').length>0?1:0;
	if(empty(name) && !sque)
	{
		myalert("Name can not be empty unless SEQUENCE checked!");
		return;
	}
	var flag = 0;
	if(ephe)
		flag = flag | ZooKeeper.ZOO_EPHEMERAL;
	if(sque)
		flag = flag | ZooKeeper.ZOO_SEQUENCE;
	if(empty(_gzk))
		return;
	var path = _gpath;
	if(path=='/')
		path += name;
	else
		path += '/'+name;
	_gzk.a_create(path, data, flag, function(rc, err, path){
		if(rc!=0)
		{
			myalert("Create child "+name+" failed, err="+err);
		}
		else
		{
			if(goac)
				zkuiRefreshPath(path);
			else
				zkuiRefreshPath();
			if(clac)
				dlg.modal('hide');
			else
				$('#create_child_dlg_name').focus().select();
		}
	});
}

function showCopyChildrenDialog()
{
	var dlg=$('#copy_children_dialog');
	dlg.modal({backdrop:false}).draggable({handle: ".modal-header"});
	$('#copy_children_dlg_path').val($('#stat_path').val());
	$('#copy_children_dlg_new_path').val($('#stat_path').val());
	//$('#copy_children_dlg_prg').parent().addClass('hidden');
	$('#copy_children_dlg_tips').addClass('hidden');
	setTimeout("$('#copy_children_dlg_new_path').focus().select();",100);
}
function ensureCopyChildren()
{
	var dlg=$('#copy_children_dialog');
	var path=$('#copy_children_dlg_path').val();
	var new_path=$('#copy_children_dlg_new_path').val();
	if(path=='/')
	{
		myalert("can not copy root");
		return;
	}
	if(path==new_path)
	{
		myalert("new path must not equal to original path");
		return;
	}
	if(path[path.length-1]=='/')
	{
		myalert("path can not end with /");
		return;
	}
	if(new_path[new_path.length-1]=='/')
	{
		myalert("new_path can not end with /");
		return;
	}
	updateCopyChildrenProg(0.01,'');
	var data = new Object();
	data.path = path;
	data.new_path = new_path;
	var async = require('async');
	async.series([
			function(callback)
			{
				//get children of path
				_gzk.a_get_children(data.path,0,function(rc,err,list){
					if(0!=rc)
					{
						var text = "get_children("+data.path+") failed, err="+err;
						updateCopyChildrenProg(0.01,text);
						callback(text,null);
						return;
					}
					list.sort(function(a,b){if(a<b)return -1; else if(a>b) return 1; return 0;});
					data.origin_list=list;
					callback(null,null);
				});
			},
			function(callback)
			{
				//get children of new_path, check whether there are conflict
				_gzk.a_get_children(data.new_path,0,function(rc,err,list){
					if(0!=rc)
					{
						var text = "get_children("+data.new_path+") failed, err="+err;
						updateCopyChildrenProg(0.01,text);
						callback(text,null);
						return;
					}
					for(var i=0; i<data.origin_list.length; ++i)
					{
						if(list.indexOf(data.origin_list[i])>=0)//check conflict
						{
							var text = "get_children("+data.new_path+") failed, err="+err;
							updateCopyChildrenProg(0.01,text);
							callback(text,null);
							return;
						}
					}
					callback(null,null);
				});
			},
			function(callback)
			{
				/**
				 * for each child, do 2 steps:
				 * 1. get the data of original child.
				 * 2. create new child in new path with data.
				 */
				 async.eachSeries(data.origin_list, function(item,cb){
				 	var idx = data.origin_list.indexOf(item);
				 	var prg = (idx+1)/(data.origin_list.length*2);
				 	updateCopyChildrenProg(prg,"get("+item+")");
				 	_gzk.a_get(data.path+'/'+item,0,function(rc,err,stat,ndt){
						if(0!=rc)
						{
							var text = "get("+item+") failed, err="+err;
							updateCopyChildrenProg(prg,text);
							cb(text);
							return;
						}
						prg = (idx+2)/(data.origin_list.length*2)
						updateCopyChildrenProg(prg,"create("+item+")");
						_gzk.a_create(data.new_path+'/'+item, ndt, 0, function(rc, err, path){
							if(rc!=0)
							{
								var text = "create("+item+") failed, err="+err;
								updateCopyChildrenProg(prg,text);
								cb(text);
								return;
							}
							cb(null,null);
						});
					});
				 }, function(err){
				 	callback(err,null)
				 });
			}
		],
		function(err,results){
			if(err)
				myalert(err);
			else
				updateCopyChildrenProg(1.0,"Copy Success");
	});
}
function updateCopyChildrenProg(prog, text)
{
	//$('#copy_children_dlg_prg').css('width',parseInt(prog*100)+'%').parent().removeClass('hidden');
	$('#copy_children_dlg_tips').removeClass('hidden').text(text);
}

function showDelChildrenDialog()
{
	var dlg=$('#del_children_dialog');
	dlg.modal({backdrop:false}).draggable({handle: ".modal-header"});
	$('#del_children_dlg_path').val($('#stat_path').val());
	$('#del_children_dlg_tips').addClass('hidden');
}
function ensureDelChildren()
{
	var dlg=$('#del_node_dialog');
	var path=$('#del_children_dlg_path').val();
	if(path=='/')
	{
		myalert("can not del children root");
		return;
	}
	updateDelChildrenProg(0.01,'');
	var data = new Object();
	data.path = path;
	var async = require('async');
	async.series([
			function(callback)
			{
				//get children of path
				_gzk.a_get_children(data.path,0,function(rc,err,list){
					if(0!=rc)
					{
						var text = "get_children("+data.path+") failed, err="+err;
						updateDelChildrenProg(0.01,text);
						callback(text,null);
						return;
					}
					list.sort(function(a,b){if(a<b)return -1; else if(a>b) return 1; return 0;});
					data.list=list;
					callback(null,null);
				});
			},
			function(callback)
			{
				//for each child, do delete action
				 async.eachSeries(data.list, function(item,cb){
				 	var idx = data.list.indexOf(item);
				 	var prg = (idx+1)/(data.list.length*2);
				 	updateDelChildrenProg(prg,"get("+item+")");
				 	_gzk.a_delete_(data.path+'/'+item, -1, function(rc,err){
						if(0!=rc)
						{
							var text = "delete("+item+") failed, err="+err;
							updateDelChildrenProg(prg,text);
							cb(text);
							return;
						}
						prg = (idx+2)/(data.list.length*2)
						updateDelChildrenProg(prg,"delete("+item+")");
						cb(null,null);
					});
				 }, function(err){
				 	callback(err,null)
				 });
			}
		],
		function(err,results){
			zkuiRefreshPath();
			if(err)
				myalert(err);
			else
				updateDelChildrenProg(1.0,"Delete All Children Success");
	});
}
function updateDelChildrenProg(prog, text)
{
	$('#del_children_dlg_tips').removeClass('hidden').text(text);
}

function showEditValDialog()
{
	var dlg=$('#edit_val_dialog');
	dlg.modal({backdrop:false}).draggable({handle: ".modal-header"});
	$('#edit_val_dlg_path').val($('#stat_path').val());
	$('#edit_val_dlg_version').text($('#stat_version').val());
	$('#edit_val_dlg_data').val($('#node_value').text());
	setTimeout("$('#edit_val_dlg_data').focus().select();",100);
}
function ensureEditVal()
{
	var dlg=$('#edit_val_dialog');
	var path=$('#edit_val_dlg_path').val();
	var ver=$('#edit_val_dlg_version').text();
	var vcheck=$('#edit_val_dlg_vcheck:checked').length>0?1:0;
	if(!vcheck)
		ver = -1;
	var data=$('#edit_val_dlg_data').val();
	_gzk.a_set(path, data, ver, function(rc, err, stat){
		if(rc!=0)
		{
			myalert("Edit node data failed, err="+err);
		}
		else
		{
			zkuiRefreshPath();
			dlg.modal('hide');
		}
	});
}

function showDelNodeDialog()
{
	var dlg=$('#del_node_dialog');
	dlg.modal({backdrop:false}).draggable({handle: ".modal-header"});
	$('#del_node_dlg_path').val($('#stat_path').val());
	$('#del_node_dlg_version').text($('#stat_version').val());
}
function ensureDelNode()
{
	var dlg=$('#del_node_dialog');
	dlg.modal({backdrop:false}).draggable({handle: ".modal-header"});
	var path=$('#del_node_dlg_path').val();
	if(path=='/')
	{
		myalert('can not delete root');
		return;
	}
	if(path=='/zookeeper')
	{
		myalert('can not delete the zookeeper node');
		return;
	}
	if(path[path.length-1]=='/')
	{
		myalert("path can not end with /");
		return;
	}
	var ver=$('#del_node_dlg_version').text();
	var vcheck=$('#del_node_dlg_vcheck:checked').length>0?1:0;
	if(!vcheck)
		ver = -1;
	_gzk.a_delete_(path, ver, function(rc, err){
		if(rc!=0)
		{
			myalert("Delete node failed, err="+err);
		}
		else
		{
			_gpath_max = '';
			zkuiGo(-1);
			dlg.modal('hide');
		}
	});
}

function dlgCheckData(format, dialog_id, data_id)
{
	var dlg = $('#'+dialog_id);
	var data = $('#'+data_id).val();
	if(format=='JSON')
	{
		try{
			JSON.parse(data)
		}catch(e) { dlgShowAlert(dlg, 'Failed!'); return; }
		dlgShowInfo(dlg, 'Success!');
	}
}
function dlgShowInfo(dlg, text)
{
	myalert(text);
}
function dlgShowAlert(dlg, text)
{
	myalert(text);
}