(function($){
	var me=this;

	// me.formCheck; // form check param, it must be passed with each request

	me.itemsList = [];
	me.itemsInfo = [];

	me.dbgStopOnItems    = null; // stop after load items..
	me.dbgStopOnArticles = null; // stop after load articles..

	me.loadRecursive_curPage = 0;
	me.loadRecursive_perPage = 50;

	me.baseUrl = 'http://getpocket.com/';

	me.e = null; // events handler

	/**
	 * set cache data
	 * @param k
	 * @param v
	 */
	me.cacheSet=function(k,v)
	{
		localStorage[k]=JSON.stringify(v);
	};

	/**
	 * return cache data
	 * @param k
	 * @returns {*}
	 */
	me.cacheGet=function(k)
	{
		if(typeof(localStorage[k])=='undefined'){ return null; }
		return JSON.parse(localStorage[k]);
	};

	/**
	 * Load items list
	 * @param from
	 * @param count
	 * @param cb
	 */
	me.loadItems=function(from,count,cb)
	{
		console.log('loading from '+from+'...');
		$.post(
			me.baseUrl+'a/x/get.php',
			{
				offset:from,
				count:count,
				state:'queue',
				favorite:null,
				sort:'newest',
				search:'',
				tag:'',
				view:'list',
				formCheck:me.formCheck
			},
			cb,
			'json'
		);
	};

	/**
	 * load list recursively
	 * @param data
	 */
	me.loadRecursive = function(data)
	{
		if(
			(typeof(data) == 'undefined')
			||
			(typeof(data.list) == 'undefined')
		){
			console.error("Wrong data returned", data);
			return;
		}

		if(
			(typeof(data.list.length) == 'undefined' || data.list.length>0)
			&&
			(me.dbgStopOnItems===null || me.dbgStopOnItems>0)
		){
			$.each(data.list,function(k,v){
				me.itemsList.push({id:k,val:v});
				if(me.dbgStopOnItems!==null){me.dbgStopOnItems-=1;}
			});

			me.loadRecursive_curPage+=me.loadRecursive_perPage;
			me.loadItems(me.loadRecursive_curPage,me.loadRecursive_perPage,loadRecursive);
		}
		else
		{
			console.groupEnd();
			console.log('found '+me.itemsList.length+' items');
			me.cacheSet('getPocketItemsList', me.itemsList);
			me.e.trigger('getpock_afterListLoad');
		}
	};

	/**
	 * clear layout to featured output
	 */
	me.clearLayout = function()
	{
		$('html head').html('');
		me.layout.html('').css({
			'text-align': 'left',
			'padding': '10px'
		});

		//fix js error on page
		me.layout.append('<div id="content">Open dev console to see process. After parsing finish, you will see results here.</div>')
	};

	/**
	 * append title to layuot
	 * @param title
	 */
	me.appendTitle = function(title)
	{
		me.layout.append('<br><hr>');

		var h=$('<h1></h1>');
		$('<a href="#"><span></span> '+title+'</a>').click(function(){
			var elSwitcher  = $('span',this);
			var elContainer = $(this).closest('h1').next('pre');
			console.log(elContainer);
			elContainer.toggle();
			if(elContainer.is(':visible'))
			{
				elSwitcher.html('&#11015;');
			}
			else
			{
				elSwitcher.html('&#10155;');
			}
			return false;
		}).appendTo(h);

		me.layout.append(h);
	};

	/**
	 * call it after each block
	 */
	me.afterBlock = function()
	{
		//
	};

	/**
	 * after list load action
	 */
	me.afterListLoad = function()
	{
		me.clearLayout();

		me.itemsList = me.cacheGet('getPocketItemsList');

		console.log('Items loaded',me.itemsList&&me.itemsList.length);

		var newList=[];
		$.each(me.itemsList,function(k,v){
			var o = {
				id: v.id,
				wc: parseInt(v.val.word_count),
				url: typeof(v.val.resolved_url)!='undefined' ? v.val.resolved_url.replace("/\#.*$/", "") : '',
				title: typeof(v.val.resolved_title)!='undefined' ?  v.val.resolved_title : ''
			};
			newList.push(o);
		});

		var content,lastItem;

		// sort by words
		me.appendTitle('Sorted by word count');
		newList.sort(function(a,b){
			return a.wc - b.wc;
		});

		content=$('<pre></pre>');
		content.append("Words\tURL\n");
		$.each(newList, function(k,v){
			content.append(v.wc+"\t"+'<a href="'+me.baseUrl+'a/read/'+v.id+'" target="_blank">'+v.url+'</a><br />');
		});
		me.layout.append(content);

		// sort by url
		content=$('<pre></pre>');
		content.append("Words\tURL\n");
		me.appendTitle('Sorted by urls');
		newList.sort(function(a,b){
			return a.url.localeCompare(b.url);
		});

		content=$('<pre></pre>');
		$.each(newList, function(k,v){
			content.append(v.wc+"\t"+'<a href="'+me.baseUrl+'a/read/'+v.id+'" target="_blank">'+v.url+'</a><br />');
		});
		me.layout.append(content);

		me.appendTitle('Double urls');
		lastItem=null;
		content=$('<pre></pre>');
		content.append("Words\tURL\n");
		$.each(newList, function(k,v){
			if(lastItem && v.url == lastItem.url)
			{
				content.append(v.url+'<br />');
				content.append(lastItem.wc+"\t"+'<a href="'+me.baseUrl+'a/read/'+lastItem.id+'" target="_blank">'+lastItem.url+'</a><br />');
				content.append(v.wc+"\t"+'<a href="'+me.baseUrl+'a/read/'+v.id+'" target="_blank">'+v.url+'</a><br />');
				content.append('<br />');
			}

			lastItem=v;
		});
		me.layout.append(content);

		// sort by title
		me.appendTitle('Ordered by title');
		newList.sort(function(a,b){
			return a.title.localeCompare(b.title);
		});

		content=$('<pre></pre>');
		content.append("Words\tTitle\n");
		$.each(newList, function(k,v){
			content.append(v.wc+"\t"+'<a href="'+me.baseUrl+'a/read/'+v.id+'" target="_blank">'+v.title+'</a><br />');
		});
		me.layout.append(content);

		me.appendTitle('Double titles');
		content=$('<pre></pre>');
		content.append("Words\tTitle -> URL\n");
		lastItem=null;
		$.each(newList, function(k,v){
			if(lastItem && v.title == lastItem.title)
			{
				content.append(v.title+'<br />');
				content.append(lastItem.wc+"\t"+'<a href="'+me.baseUrl+'a/read/'+lastItem.id+'" target="_blank">'+lastItem.title+' -> '+lastItem.url+'</a><br />');
				content.append(v.wc+"\t"+'<a href="'+me.baseUrl+'a/read/'+v.id+'" target="_blank">'+v.title+' -> '+v.url+'</a><br />');
				content.append('<br />');
			}

			lastItem=v;
		});
		me.layout.append(content);

		if(me.cacheGet('getPocketItemsInfo'))
		{
			me.e.trigger('getpock_afterLoadArticlesInfo');
		}
		else
		{
			me.loadArticlesInfo();
		}
	};

	/**
	 * load articles info
	 */
	me.loadArticlesInfo = function()
	{
		console.group("Loading Articles Info");
		me.itemsList = me.cacheGet('getPocketItemsList');

		var countAll = (me.dbgStopOnArticles===null) ? me.itemsList.length : Math.min(me.itemsList.length, me.dbgStopOnArticles);
		var countCur = 0;

		console.log("Start loading article one by one, "+countAll+" items");

		$.each(me.itemsList,function(k,item){
			if(me.dbgStopOnArticles!==null && me.dbgStopOnArticles--<1){return;}
			var cacheKey='getPocketItemsInfo_id'+item.id+'_'+me.formCheck;
			var info = me.cacheGet(cacheKey);
			if(info!==null)
			{
				countCur++;

				me.itemsInfo.push(info);

				console.log('(cache) '+(countCur*100/countAll).toFixed(2)+'% ('+countCur+'): item '+item.id+
							"\tlength: " + info.len +
							"\tt: " + info.title);
			}
			else
			{
				$.post(
					me.baseUrl+'a/x/getArticle.php',
					{
						itemId: item.id,
						formCheck:me.formCheck
					},
					function(r){
						countCur++;

						if(typeof(r.status)==='undefined' || !r.status || typeof(r.article) == 'undefined')
						{
							console.log("Error loading "+item.id+"!");
							return;
						}

						var o = {
							id:				r.article.resolved_id,
							url:			r.article.resolvedUrl.replace(/\#.*$/, ""),
							title:			r.article.title,
							responseCode:	r.article.responseCode,
							wc:				parseInt(r.article.wordCount),
							len:			(r.article.article+'').length
						};
						me.itemsInfo.push(o);
						me.cacheSet(cacheKey,o);

						console.log((countCur*100/countAll).toFixed(2)+'% ('+countCur+'): item '+item.id+
								"\tlength: " + o.len +
								"\tt: " + o.title);
					},
					'json'
				);
			}
		});

		var wait = function()
		{
			if(countCur>=countAll)
			{
				console.groupEnd();
				console.log("Articles are loaded!");

				me.cacheSet('getPocketItemsInfo', me.itemsInfo);
				me.e.trigger('getpock_afterLoadArticlesInfo');
				return;
			}
			console.log("Wait for article loads, left "+(countAll-countCur)+" items ...");
			setTimeout(wait, 1000);
		};
		wait();
	};

	/**
	 * after articles info loaded
	 */
	me.afterLoadArticlesInfo = function()
	{
		me.itemsInfo = me.cacheGet('getPocketItemsInfo');

		// sort by articlelength
		me.appendTitle('Sorted by article length');
		me.itemsInfo.sort(function(a,b){
			return b.len - a.len;
		});

		var content=$('<pre></pre>');
		$.each(me.itemsInfo, function(k,v){
			content.append(v.len+"\t"+'<a href="'+me.baseUrl+'a/read/'+v.id+'" target="_blank">'+v.title+'</a><br />');
		});
		me.layout.append(content);

		// add tags control
		me.appendTitle('Add tags to articles');
		content=$('<a>Add tags with article length (sample: "10-20k chars")</a>');
		content.attr('href','#').click(function(){
			me.addTags();
			return false;
		});
		me.layout.append(content);
	};

	/**
	 * add tags action
	 */
	me.addTags = function()
	{
		me.itemsInfo = me.cacheGet('getPocketItemsInfo');

		if(!me.itemsInfo)
		{
			throw 'Empty items info';
		}

		console.log('Items to parse: ',me.itemsInfo.length);

		var tags={};
		var tagsCount=0;
		$.each(me.itemsInfo,function(k,item){
			var len=Math.round(item.len/1000);
			var s=len;
			     if(len>=  0&&len<=   5){s=   '0-5'}
			else if(len>   5&&len<=  10){s=  '5-10'}
			else if(len>  10&&len<=  15){s= '10-15'}
			else if(len>  15&&len<=  20){s= '15-20'}
			else if(len>  20&&len<=  25){s= '20-25'}
			else if(len>  25&&len<=  30){s= '25-30'}
			else if(len>  30&&len<=  40){s= '30-40'}
			else if(len>  40&&len<=  50){s= '40-50'}
			else if(len>  50&&len<=  70){s= '50-70'}
			else if(len>  70&&len<= 100){s= '70-100'}
			else if(len> 100           ){s=    '100+'}
			s+='k chars';
			if(typeof(tags[s])=='undefined')
			{
				tags[s]=[];
				tagsCount++;
			}
			tags[s].push(item.id);
		});

		// add actual tags
		if(tagsCount>0)
		{
			$.each(tags, function(tagName, ids){
				content=$('<p></p>');
				content.html('Adding "'+tagName+'", items: '+(ids ? ids.length : 0));
				me.layout.append(content);

				$.post(
					me.baseUrl+'a/x/bulkEdit.php',
					{
						items:ids,
						tagType:'tags_add',
						tags: tagName,
						formCheck:me.formCheck
					},
					function(res){
						if(typeof(res.status)=='undefined' || !res.status)
						{
							console.warn('Error on adding tag ['+tagName+']');
						}
						else
						{
							console.log("done for ",tagName);
						}
					},
					'json'
				);
			});
		}
		else
		{
			console.log("Nothing to tag.")
		}
	};

	/**
	 * get form check token
	 */
	me.fetchFormCheck = function()
	{
		var formCheck = null;

// get formCheck token
		var scripts = document.getElementsByTagName('script');
		for(var i=0, l=scripts.length; i<l; i++)
		{
			var m=scripts[i].text.match(/[ \r\n\t,]+formCheck[ \r\n\t]*=[ \r\n\t]*[\'\"]([a-zA-Z0-9]+)[\'\"]/i);
			if(m)
			{
				formCheck = m[1];
				break;
			}
		}

		if(typeof(formCheck) == 'undefined' || !formCheck)
		{
			console.log('Not logged in...');

			// not logged in
			//TODO show message
/*
			chrome.tabs.sendMessage(null, {greeting: "hello"}, function(response) {
				console.log(response);
			});
*/

			return false;
		}

		console.log('formCheck: ',formCheck);
		me.formCheck = formCheck;

		return true;
	};

	/**
	 * init object
	 */
	me.init = function()
	{
		// assign main vars
		console.log('GetPocket List Extension started...');
		me.layout = $(document.body);
		me.e = me.layout;

		if(!me.fetchFormCheck())
		{
			return false;
		}

		// bind events
		me.e.bind('getpock_afterListLoad', me.afterListLoad);
		me.e.bind('getpock_afterLoadArticlesInfo', me.afterLoadArticlesInfo);

		// clear all layouts
		console.clear();
		me.clearLayout();

		return true;
	};

	/**
	 * run parsing
	 */
	me.run = function()
	{
		if(me.cacheGet('getPocketItemsList'))
		{
			me.e.trigger('getpock_afterListLoad');
		}
		else
		{
			console.group("Loading Articles List");
			me.loadItems(me.loadRecursive_curPage,me.loadRecursive_perPage,me.loadRecursive);
		}
	};

	// actual run
	$(function(){
		// clear cache
		me.cacheSet('getPocketItemsList', null);
		me.cacheSet('getPocketItemsInfo', null);

		if(me.init())
		{
			me.run();
		}
	});

})(window.jQuery);

