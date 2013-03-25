(function($){
	var me=this;

	me.itemsList = [];
	me.itemsTotal = 0;

	me.itemsInfo = [];

	me.dbgStopOnItems    = null; // stop after load items..
	me.dbgStopOnArticles = null; // stop after load articles..

	me.loadRecursive_curPage = 0;
	me.loadRecursive_perPage = 50;

	me.loadItems=function(from,count,cb)
	{
		console.log('loading from '+from+'...');
		$.post(
			'http://getpocket.com/a/x/get.php',
			{
				offset:from,
				count:count,
				state:'queue',
				favorite:null,
				sort:'newest',
				search:'',
				tag:'',
				view:'list',
				formCheck:window.formCheck
			},
			cb,
			'json'
		);
	}

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
				me.itemsTotal++;
				if(me.dbgStopOnItems!==null){me.dbgStopOnItems-=1;}
			});

			me.loadRecursive_curPage+=me.loadRecursive_perPage;
			me.loadItems(me.loadRecursive_curPage,me.loadRecursive_perPage,loadRecursive);
		}
		else
		{
			console.groupEnd();
			console.log('found '+me.itemsTotal+' items');
			document.getPocketItemsList = me.itemsList;
			document.getPocketItemsTotal = me.itemsTotal;
			me.afterLoad();
		}
	};

	me.clearLayout = function()
	{
		me.layout.html('').css({
			'text-align': 'left',
			'padding': '10px'
		});
	};

	me.appendTitle = function(title)
	{
		me.layout.append('<br><br> <hr> <h1>'+title+'</h1><br><br>');
	};

	me.afterLoad = function()
	{
		me.clearLayout();

		me.itemsList = document.getPocketItemsList;
		me.itemsTotal = document.getPocketItemsTotal;

		var newList=[];
		$.each(me.itemsList,function(k,v){
			var o = {
				id: v.id,
				wc: parseInt(v.val.word_count),
				url: v.val.resolved_url.replace("#habracut", ""),
				title: v.val.resolved_title
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
		$.each(newList, function(k,v){
			content.append(v.wc+"\t"+'<a href="http://getpocket.com/a/read/'+v.id+'" target="_blank">'+v.url+'</a><br />');
		});
		me.layout.append(content);

		// sort by url
		content=$('<pre></pre>');
		me.appendTitle('Sorted by urls');
		newList.sort(function(a,b){
			return a.url.localeCompare(b.url);
		});
		
		content=$('<pre></pre>');
		$.each(newList, function(k,v){
			content.append(v.wc+"\t"+'<a href="http://getpocket.com/a/read/'+v.id+'" target="_blank">'+v.url+'</a><br />');
		});
		me.layout.append(content);

		me.appendTitle('Double urls');
		lastItem=null;
		content=$('<pre></pre>');
		$.each(newList, function(k,v){
			if(lastItem && v.url == lastItem.url)
			{
				content.append(v.url+'<br />');
				content.append(lastItem.wc+"\t"+'<a href="http://getpocket.com/a/read/'+lastItem.id+'" target="_blank">'+lastItem.url+'</a><br />');
				content.append(v.wc+"\t"+'<a href="http://getpocket.com/a/read/'+v.id+'" target="_blank">'+v.url+'</a><br />');
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
		$.each(newList, function(k,v){
			content.append(v.wc+"\t"+'<a href="http://getpocket.com/a/read/'+v.id+'" target="_blank">'+v.title+'</a><br />');
		});
		me.layout.append(content);

		me.appendTitle('Double titles');
		content=$('<pre></pre>');
		lastItem=null;
		$.each(newList, function(k,v){
			if(lastItem && v.title == lastItem.title)
			{
				content.append(v.title+'<br />');
				content.append(lastItem.wc+"\t"+'<a href="http://getpocket.com/a/read/'+lastItem.id+'" target="_blank">'+lastItem.title+'</a><br />');
				content.append(v.wc+"\t"+'<a href="http://getpocket.com/a/read/'+v.id+'" target="_blank">'+v.title+'</a><br />');
				content.append('<br />');
			}

			lastItem=v;
		});
		me.layout.append(content);

		if(typeof(document.getPocketItemsInfo)!='undefined')
		{
			me.afterLoadArticlesInfo();
		}
		else
		{
			me.loadArticlesInfo();
		}
	};

	me.loadArticlesInfo = function()
	{
		console.group("Loading Articles Info");
		me.itemsList = document.getPocketItemsList;

		var countAll = (me.dbgStopOnArticles===null) ? me.itemsList.length : Math.min(me.itemsList.length, me.dbgStopOnArticles);
		var countCur = 0;

		console.log("Start loading article one by one, "+countAll+" items");

		$.each(me.itemsList,function(k,item){
			if(me.dbgStopOnArticles!==null && me.dbgStopOnArticles--<1){return;}
			$.post(
				'http://getpocket.com/a/x/getArticle.php',
				{
					itemId: item.id,
					formCheck:window.formCheck
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
						url:			r.article.resolvedUrl.replace("#habracut", ""),
						title:			r.article.title,
						responseCode:	r.article.responseCode,
						wc:				parseInt(r.article.wordCount),
						len:			(r.article.article+'').length
					};
					me.itemsInfo.push(o);

					console.log((countCur*100/countAll).toFixed(2)+'% ('+countCur+'): item '+item.id+
							"\tlength: " + o.len +
							"\tt: " + o.title);
				},
				'json'
			);
		});

		var wait = function()
		{
			if(countCur>=countAll)
			{
				console.groupEnd();
				console.log("Articles are loaded!");

				document.getPocketItemsInfo = me.itemsInfo;
				me.afterLoadArticlesInfo();
				return;
			}
			console.log("Wait for article loads, left "+(countAll-countCur)+" items ...");
			setTimeout(wait, 3000);
		}
		wait();
	};

	me.afterLoadArticlesInfo = function()
	{
		me.itemsInfo = document.getPocketItemsInfo;

		// sort by articlelength
		me.appendTitle('Sorted by article length');
		me.itemsInfo.sort(function(a,b){
			return b.len - a.len;
		});

		content=$('<pre></pre>');
		$.each(me.itemsInfo, function(k,v){
			content.append(v.len+"\t"+'<a href="http://getpocket.com/a/read/'+v.id+'" target="_blank">'+v.title+'</a><br />');
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

	me.addTags = function()
	{
		me.itemsInfo = document.getPocketItemsInfo;

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
				content.html('Adding "'+tagName+'", items: '+ids.length);
				me.layout.append(content);

				$.post(
					'http://getpocket.com/a/x/bulkEdit.php',
					{
						items:ids,
						tagType:'tags_add',
						tags: tagName,
						formCheck:window.formCheck
					},
					function(res){
						if(typeof(res.status)=='undefined' || !res.status)
						{
							console.warn('Error on adding tag ['+tagName+']');
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

	me.init = function()
	{
		console.log('GetPocket List Extension started...');
		me.layout = $(document.body);

		console.clear();
		me.clearLayout();
	};

	me.run = function()
	{
		if(typeof(document.getPocketItemsTotal)!='undefined')
		{
			me.afterLoad();
		}
		else
		{
			console.group("Loading Articles List");
			me.loadItems(me.loadRecursive_curPage,me.loadRecursive_perPage,me.loadRecursive);
		}
	};

	me.init();
	me.run();
})(window.jQuery);
