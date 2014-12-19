function isundef(o) { return typeof(o)=='undefined'; }
function isset(o) { if(typeof(o)=='undefined') return false; else return null!=o; }
function empty(o)
{
	if(null==o) return true;
	switch(typeof(o))
	{
	case 'undefined': return true;
	case 'string': return o.length==0;
	case 'number': return o==0;
	case 'boolean': return !o;
	case 'function':
	case 'object': return null==o;
	default: throw new Error('unknown type '+typeof(o));
	}
}

function Timer()
{
	var t=this;
	if(0==arguments.length)
		t.__opt={tval:1.0,handler:window,callback:null};
	else if(1==arguments.length)
		t.__opt={tval:parseFloat(arguments[0]),handler:window,callback:null};
	else if(2==arguments.length)
		t.__opt={tval:parseFloat(arguments[0]),handler:window,callback:arguments[1]};
	else// if(arguments.length>=3)
		t.__opt={tval:parseFloat(arguments[0]),handler:arguments[1],callback:arguments[2]};
	t.__opt._step=0;
	t.__opt._ori_id=0;
	t.__count = 0;	//how many times this timer has been fired. it will be reset to 0 after start() or stop() or restart().
	t.start=function() { t.stop(); ___TMRstart(t); };
	t.stop=function() { ___TMRstop(t); };
	t.restart=function() { t.start() };
	t.fire=function()
	{
		if(isset(t.__opt.callback))
		{
			++t.__count;
			t.__opt.callback.call(t.__opt.handler,t);
		}
	};
	t.setTval=function(v) { t.__opt.tval=v; };
	t.getTval=function() { return t.__opt.tval; };
	t.setCallback=function(c) { t.__opt.callback=c; };
	t.getCallback=function() { return t.__opt.callback; };
	t.count=function() { return t.__count; };
}
___TMR={};
___TMR.step=0;
function ___TMRstart(tmr)
{
	tmr.__opt._step=++___TMR.step;
	tmr.__opt._ori_id=setInterval("___TMRon("+tmr.__opt._step+")",tmr.__opt.tval*1000);
	___TMR['tm'+tmr.__opt._step]=tmr;
};
function ___TMRstop(tmr)
{
	if(isundef(___TMR['tm'+tmr.__opt._step])) return;
	delete ___TMR['tm'+tmr.__opt._step];
	tmr.__opt._step = 0;
	clearInterval(tmr.__opt._ori_id);
	tmr.__opt._ori_id = 0;
	tmr.__count = 0;
};
function ___TMRon(step)
{
	if(!isset(___TMR['tm'+step])) return;
	var tmr=___TMR['tm'+step];
	tmr.fire();
}

function log()
{
	var args = Array.prototype.slice.call(arguments);
	console.log.apply(console, args);
	/*var t=(typeof(c)).toLowerCase();
	if(-1!=t.indexOf('event'))
		console.log('Event, type='+c.type+', target='+c.target);
	if(-1!=t.indexOf('error'))
		console.log('Error, msg='+c.message+' ['+c.lineNumber+'@'+c.fileName+']');
	else
		console.log(c);*/
}

function getCookie(name)
{
	var cookie_start = document.cookie.indexOf(name);
	var cookie_end = document.cookie.indexOf(";", cookie_start);
	return cookie_start == -1 ? '' : unescape(document.cookie.substring(cookie_start + name.length + 1, (cookie_end > cookie_start ? cookie_end : document.cookie.length)));
}
function setCookie(cookieName, cookieValue, seconds, path, domain, secure)
{
	var expires = new Date();
	if(!empty(seconds))
		expires.setTime(expires.getTime() + seconds*1000);
	else
		expires = false;
	document.cookie = escape(cookieName) + '=' + escape(cookieValue)
	+ (expires ? '; expires=' + expires.toGMTString() : '')
	+ (path ? '; path=' + path : '/')
	+ (domain ? '; domain=' + domain : '')
	+ (secure ? '; secure' : '');
}