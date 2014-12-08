ZooKeeper = require ("zookeeper");
_gzk = null;
_gpath = '/';
$(document).ready(
	function()
	{
		var tmr = new Timer(5.0, zkuiEnsureConnection);
		tmr.start();
		zkuiEnsureConnection();
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
	log('connecting host='+host)
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
	_gzk.a_get_children2(_gpath,0,function(rc,err,list,stat){
		if(0!=rc)
		{
			myalert("ls "+path+" failed, err="+err);
			return;
		}
		zkuiNavBreadUpdate();
		zkuiChildrenUpdate(list);
		zkuiStatUpdate(stat);
	});
}
_gpath_max = '/';
function zkuiNavBreadUpdate()
{
	var bread_path = _gpath;
	if(0==_gpath_max.indexOf(_gpath))
		bread_path = _gpath_max;
	var _arr = _gpath_max.split('/');
	var arr = new Array();
	arr.push('/');
	for(var i=0; i<_arr.length; ++i)
	{
		if(!empty(_arr[i]))
			arr.push(_arr[i]);
	}
	var dom = $('#nav_bread');
	var spl = dom.find('[name=sample]');
	var splact = dom.find('[name=sample_active]');
	var step = '';
	for(var i=0; i<arr.length; ++i)
	{
		log('idx='+i+', val='+arr[i]);
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
		var txt = arr[1];
		if(step=='/')
			txt = 'ROOT';
		if(isact)
			d.text(txt);
		else
			d.find('a').text(txt).attr('href','javascript:zkuiRefreshPath("'+step+'")');
		dom.append(d);
	}
}
function zkuiChildrenUpdate()
{
}
function zkuiStatUpdate()
{
}