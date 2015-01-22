_gpath = '/';
_myalert_dom = null
$(document).ready(
	function()
	{
		log("REFRESH-----------------")
		_myalert_dom = $('#myalert')
		var tmr = new Timer(5.0, zkuiEnsureConnection);
		tmr.start();
		_myalert_dom.tmr = new Timer(5.0, function(){_myalert_dom.fadeOut(200)})
		
		if(zkuiEnsureConnection())
			zkuiRefreshPath();

		//showDefaultAclDialog();
	}
);
function myalert(text)
{
	_myalert_dom.find('[name=text_con]').removeClass('alert-success').addClass('alert-danger');
	_myalert_dom.find('[name=text]').text(text);
	_myalert_dom.fadeIn(200);
	_myalert_dom.tmr.restart();
}
function myokinfo(text)
{
	_myalert_dom.find('[name=text_con]').removeClass('alert-danger').addClass('alert-success');
	_myalert_dom.find('[name=text]').text(text);
	_myalert_dom.fadeIn(200);
	_myalert_dom.tmr.restart();
}
function zkuiEnsureConnection()
{
	if(py.jsZkIsConnected())
		return true;
	var host = py.jsGetCfg('zkhost');
	//var oatype = getCookie('zkauthtype');
	//var oaval = getCookie('zkauthval');
	var obj = py.jsZkConnect(host)
	if(!empty(obj))
	{
		myalert("connect() failed: err="+obj)
		return false;
	}
	zkuiRefreshPath();
	return true;
}
function zkuiRefreshPath(path)
{
	if(!empty(path))
		_gpath = path;
	log("refreshing path = " + _gpath);
	//children
	var obj = py.jsZkGetChildren(_gpath)
	if(!empty(obj.err))
	{
		myalert("get_children("+_gpath+") failed, err="+obj.err);
		return;
	}
	zkuiNavBreadUpdate();
	zkuiChildrenUpdate(obj.children);
	//data & stat
	obj = py.jsZkGet(_gpath)
	if(!empty(obj.err))
	{
		myalert("get("+_gpath+") failed, err="+obj.err);
		return;
	}
	zkuiStatUpdate(obj.stat);
	zkuiValueUpdate(obj.data);
	//acl
	obj = py.jsZkGetAcl(_gpath)
	if(!empty(obj.err))
	{
		myalert("get("+_gpath+") failed, err="+obj.err);
		return;
	}
	zkuiAclUpdate(obj.acl_list);
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
		if(acl.perms&31)
			perm_str+='ALL';
		else
		{
			if(acl.perms&1)
				perm_str+='r';
			if(acl.perms&2)
				perm_str+='w';
			if(acl.perms&4)
				perm_str+='c';
			if(acl.perms&8)
				perm_str+='d';
			if(acl.perms&16)
				perm_str+='a';
		}
		var d = spl.clone().removeClass('hidden').attr('name','acl_real');
		d.find('input').val(perm_str+'@'+acl.scheme+'@'+acl.digest);
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
	var path = _gpath;
	if(path=='/')
		path += name;
	else
		path += '/'+name;
	err = py.jsZkCreate(path, data, ephe, sque);
	if(!empty(err))
	{
		myalert("Create child "+name+" failed, err="+err);
		return;
	}
	if(goac)
		zkuiRefreshPath(path);
	else
		zkuiRefreshPath();
	if(clac)
		dlg.modal('hide');
	else
		$('#create_child_dlg_name').focus().select();
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
	var max_depth = parseInt($('#copy_children_dlg_max_depth').val());
	var ccheck = $('#copy_children_dlg_children_only:checked').length>0?1:0;
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
	if(max_depth<1)
	{
		myalert("max_depth should be at least 1");
		return;
	}
	updateCopyChildrenProg(0.01,'');
	err = py.jsZkCopy(new_path, path, max_depth, ccheck)
	if(!empty(err))
		myalert(err);
	else
		updateCopyChildrenProg(1.0,"Copy Success");
}
function updateCopyChildrenProg(prog, text)
{
	//$('#copy_children_dlg_prg').css('width',parseInt(prog*100)+'%').parent().removeClass('hidden');
	$('#copy_children_dlg_tips').removeClass('hidden').text(text);
	if(text.length)
	{
		if(prog>=1)
			myokinfo(text)
	}
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
	var max_depth = parseInt($('#del_children_dlg_max_depth').val());
	if(path=='/')
	{
		myalert("can not del children root");
		return;
	}
	if(max_depth<1)
	{
		myalert("max_depth should be at least 1");
		return;
	}
	updateDelChildrenProg(0.01,'');
	err = py.jsZkDeleteChildren(path, max_depth)
	if(!empty(err))
		myalert(err);
	else
	{
		updateDelChildrenProg(1.0,"Delete All Children Success");
		zkuiRefreshPath();
	}
}
function updateDelChildrenProg(prog, text)
{
	$('#del_children_dlg_tips').removeClass('hidden').text(text);
	if(text.length)
	{
		if(prog>=1)
			myokinfo(text)
	}
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
	err = py.jsZkSet(path, data, ver)
	if(!empty(err))
		myalert("Edit node data failed, err="+err);
	else
	{
		zkuiRefreshPath();
		dlg.modal('hide');
	}
}

function showDelNodeDialog()
{
	var dlg=$('#del_node_dialog');
	dlg.modal({backdrop:false}).draggable({handle: ".modal-header"});
	$('#del_node_dlg_path').val($('#stat_path').val());
	$('#del_node_dlg_version').text($('#stat_version').val());
	$('#del_node_dlg_rcheck').val([]);
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
	var rcheck=$('#del_node_dlg_rcheck:checked').length>0?1:0;
	if(rcheck)
	{
		if(!confirm("DANGER: [recursive delete] checked on, do you really want this?"))
			return;
	}
	err = py.jsZkDelete(path, ver, rcheck)
	if(!empty(err))
		myalert("Delete node failed, err="+err);
	else
	{
		_gpath_max = '';
		zkuiGo(-1);
		dlg.modal('hide');
	}
}

function showExportDialog()
{
	var dlg=$('#export_dialog');
	dlg.modal({backdrop:false}).draggable({handle: ".modal-header"});
	$('#export_dlg_path').val($('#stat_path').val());
}
function ensureExportDialog()
{
	var dlg=$('#export_dialog');
	dlg.modal({backdrop:false}).draggable({handle: ".modal-header"});
	var path=$('#export_dlg_path').val();
	if(path=='/zookeeper')
	{
		myalert('can not export the zookeeper node');
		return;
	}
	if(path.length>1)
	{
		if(path[path.length-1]=='/')
		{
			myalert("path can not end with /");
			return;
		}
	}
	var local_path=$('#export_dlg_local_path').val();
	if(empty(local_path))
	{
		myalert("local path can not be empty");
		return;
	}
	if(local_path[local_path.length-1]=='/')
	{
		myalert("local_path can not end with /");
		return;
	}
	var max_depth = parseInt($('#export_dlg_max_depth').val());
	if(max_depth<1)
	{
		myalert("max_depth should be at least 1");
		return;
	}
	err = py.jsZkExport(local_path, path, max_depth)
	if(!empty(err))
		myalert("Export failed, err="+err);
	else
		myokinfo("Export Success");
}

function showImportDialog()
{
	var dlg=$('#import_dialog');
	dlg.modal({backdrop:false}).draggable({handle: ".modal-header"});
	$('#import_dlg_path').val($('#stat_path').val());
}
function ensureImportDialog()
{
	var dlg=$('#import_dialog');
	dlg.modal({backdrop:false}).draggable({handle: ".modal-header"});
	var path=$('#import_dlg_path').val();
	if(path=='/zookeeper')
	{
		myalert('can not import into the zookeeper node');
		return;
	}
	if(path.length>1)
	{
		if(path[path.length-1]=='/')
		{
			myalert("path can not end with /");
			return;
		}
	}
	var local_path=$('#import_dlg_local_path').val();
	if(empty(local_path))
	{
		myalert("local path can not be empty");
		return;
	}
	if(local_path[local_path.length-1]=='/')
	{
		myalert("local_path can not end with /");
		return;
	}
	var max_depth = parseInt($('#import_dlg_max_depth').val());
	if(max_depth<1)
	{
		myalert("max_depth should be at least 1");
		return;
	}
	err = py.jsZkImport(local_path, path, max_depth)
	if(!empty(err))
		myalert("Import failed, err="+err);
	else
		myokinfo("Import Success");
}

function showDefaultAclDialog()
{
	var dlg=$('#default_acl_dialog');
	dlg.modal({backdrop:false}).draggable({handle: ".modal-header"});
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
	myokinfo(text);
}
function dlgShowAlert(dlg, text)
{
	myalert(text);
}