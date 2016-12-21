var areaSelectChange = (function($, hotCities, provinces, cities) {
	/*
	 *obj object
	 *obj.hideName.hotcityName:热门城市的隐藏input的name
	 *obj.hideName.provinceName:省的对应的隐藏input的name
	 *obj.hideName.cityName:地级市对应的隐藏input的name
	 *obj.hideName.countyName:县对应的隐藏input的name
	 *obj.showFun:展开地区菜单回调函数
	 *obj.hideFun:隐藏地区菜单回调函数
	 *obj.clickItemFun:点击地区的回调函数
	 *obj.hideCity:隐藏市
	 *obj.hideCounty:隐藏县
	 *obj.inputFlag:是否支持输入  true:可输入  false：不能输入（默认为false）
	 *obj.historyShow:是否支持显示历史记录  true:显示历史记录  false：不显示（默认为false）
	 *obj.clearFlag:是否支持清空搜索条件的操作  true:支持  false：不支持（默认为false）
	 */
	function AreaSelectChange(selectId, obj) {
		if (selectId) {
			this.selectContainer = $("#" + selectId);
			this.selectContent = this.selectContainer.find(".city_content");
			this.selectAddList = this.selectContainer.find(".city_add_list");
			this.areaName = this.selectContainer.find(".area_name");
			this.areaTitle = this.selectContainer.find(".area_title");
			this.areaTips = this.selectContainer.find(".auto_tips");
			this.area_list = this.selectContainer.find(".area_list");
			this.areaTab = this.selectContainer.find(".select_tab");
			this.areaListWar = this.selectContainer.find(".areaListWar");
			this.areaClose = this.selectContainer.find(".city_close");
			this.cityClear = {};


			this.loadedHot = false;
			this.loadedProvince = false;
			this.historyRepeat = false;
			this.currentArea = {};
			this.o = obj || {};
			this.hasHot = this.o.hasHot || false;
			this.hideCity = this.o.hideCity || false;
			this.hideCounty = this.o.hideCounty || false;
			this.inputFlag = this.o.inputFlag || false;
			this.historyShow = this.o.historyShow || false;
			// 省市县的分割线 todo
			this.splitLine = "/";

			// 是否添加清空搜索条件交互
			this.clearFlag = this.o.clearFlag || false;
			this.init();

		}
	}
	AreaSelectChange.prototype = {
		init: function() {
			this.renderDom();
			this.bindEvents();
			this.tabChange();
			this.createHideIpt();
			this.createHistoryCityDom();
		},

		// 初始化一些dom
		renderDom: function(argument) {

			var _self = this;

			if (_self.inputFlag) {
				// 可以输入，如果是span标签，把span清掉，同时插入一个input
				if (_self.areaTitle.size() > 0 && _self.areaTitle.is('span')) {
					$('<input type="text" class="area_title" placeholder="城市名（中文/拼音）">').insertAfter(_self.areaTitle);
					_self.areaTitle.remove();
				}
				if (_self.selectContainer.find(".city_add_list").size() === 0) {
					$('<div class="city_add_list"></div>').insertAfter(_self.selectContent);
				}
				_self.areaTitle = this.selectContainer.find(".area_title");
				_self.selectAddList = this.selectContainer.find(".city_add_list");
			}
			_self.areaTab.html("");
			_self.areaListWar.html("");
			_self.areaTab.append($('<a href="javascript:;" class="current" data-to="province_list">省份</a>'));
			_self.areaListWar.append($('<div class="area_list province_list"></div>'));

			// hack 如果配置中隐藏 市，强制 县 置为隐藏
			if (_self.hideCity === true) {
				_self.hideCounty = true;
			}
			// 市的tab 和对应的div
			if (_self.hideCity !== true) {
				_self.areaTab.append($('<a href="javascript:;" data-to="city_list">城市</a>'));
				_self.areaListWar.append($('<div class="area_list city_list"></div>'));
			}

			// 县的tab 和对应的div
			if (_self.hideCounty !== true) {
				_self.areaTab.append($('<a href="javascript:;" data-to="county_list">县区</a>'));
				_self.areaListWar.append($('<div class="area_list county_list"></div>'));
			} else {
				_self.areaTab.removeClass("areaOneTab").addClass("areaTwoTabs");
			}

			if (_self.hideCounty === true && _self.hideCity === true) {
				_self.areaTab.removeClass("areaTwoTabs").addClass("areaOneTab");
			}

			// 关闭弹窗
			_self.areaTab.append($('<a href="javascript:;" class="city_close">关闭</a>'));

			if (_self.clearFlag == true) {
				$('<div class="cityClear"><a href="javascript:;">清空搜索</a></div>').insertAfter(_self.areaTab);

				_self.cityClear = _self.selectContainer.find(".cityClear a");

			}
		},

		bindEvents: function() {
			var cont = this.selectContainer;
			var selCnt = this.selectContent;
			var selAddList = this.selectAddList;
			var _self = this;
			var csa = this.currentArea;
			var optObj = this.o;
			var optObjHideName = {};
			if (optObj && optObj.hideName) {
				optObjHideName = optObj.hideName;
			}
			var isInputText = this.areaTitle.is('input[type="text"]');

			// 清空输入内容
			if (_self.clearFlag) {
				_self.cityClear.on("click", function(e) {
					_self.resetSelect();
					_self.hidePanel();
					e.stopPropagation();
				});
			}

			//点击展开和隐藏
			this.areaName.on("click", function(e) {

				$("div.city_content").hide();
				$("div.city_add_list").hide();
				if (selCnt.is(":visible") == true || selAddList.is(":visible") == true) {
					_self.hidePanel();
				} else {
					_self.hasHot && _self.showHotCitys(hotCities);
					_self.showProvince(provinces);
					_self.showPanel();

					_self.o.showFun && _self.o.showFun();
					_self.selectCurrentItem();
				}
				e.stopPropagation();
			});

			//手动输入汉字或者拼音匹配
			this.areaTitle.on("keyup", function(e) {
				var keyCode = e.keyCode;
				var val = _self.areaTitle.val().replace(/(^\s*)|(\s*$)/g, '');
				switch (keyCode) {
					case 37: // left
						return false;
						break;
					case 39: // right
						return false;
						break;
					case 40: // down
						return false;
						break;
					case 38: // up 
						return false;
						break;
					case 16: // shift
						return false;
						break;
					case 17: // ctrl
						return false;
						break;
					case 18: // alt
						return false;
						break;
					case 9: // tab	
						return false;
						break;
					case 13: // enter
						return false;
						break;
					case 27: // escape
						return false;
						break;
						// case 32: // space  
						// 	return false;
						// 	break;
				}
				_self.hidePanel();
				if (val != '') {
					_self.showAddList(val);
				} else {
					selAddList.hide();
				}
				e.stopPropagation();
			});

			//手动查找填充结果
			this.selectAddList.on("click", "li a", function(e) {
				var _this = $(this);

				var areaTitle = _self.areaTitle;
				var pid = _this.attr('data-pid');
				var cid = _this.attr('data-cid');
				var tid = _this.attr('data-tid');
				var valArr = _this.text().split(' ');
				csa["p"] = valArr[0];
				csa["c"] = valArr[1];
				csa["t"] = valArr[2];
				areaTitle.val(_this.text());
				_self.fillInDataId(pid, cid, tid);
				_self.showSelectAddress(pid, cid, tid);
				_self.loadedProvince = true;
				selAddList.hide();
				e.stopPropagation();

			});

			//填充选择
			this.selectContainer.on("click", ".items a", function(e) {
				var _this = $(this);
				var origin = _this.attr("data-origin");
				var areaTitle = _self.areaTitle;
				//热门城市
				//origin--点击元素的所在的类别
				//hot 热门城市
				//p 省/直辖市
				//c 地级市
				//t 县
				var thisId = _this.attr("data-id");
				if (origin == "hot") {
					isInputText ? areaTitle.val(_this.text()) : areaTitle.text(_this.text());
					//areaTitle.attr("data-hotid", thisId);
					cont.find('[data-target="city"]').val(thisId);
					_self.hidePanel();
				} else if (origin == "p") {
					csa["p"] = _this.text();
					//areaTitle.attr("data-pid", thisId);
					cont.find('[data-target="province"]').val(thisId);
					cont.find('[data-target="city"]').val('');
					cont.find('[data-target="county"]').val('');
					_self.tabItem("city_list");
					isInputText ? areaTitle.val(csa["p"]) : areaTitle.text(csa["p"]);

					if (!_self.hideCity) {
						_self.showCity(thisId, "city_list", "c");
					} else {
						_self.hidePanel();
					}

					cont.find(".county_list").html("");

					// 点击省的是把全称放到data内存起来
					cont.attr("data-pid", _this.attr("data-id"));
					cont.attr("data-tid", "");
					cont.attr("data-cid", "");

				} else if (origin == "c") {
					csa["c"] = _this.text();
					var atitle = csa["p"] + " " + csa["c"];
					isInputText ? areaTitle.val(atitle) : areaTitle.text(atitle);
					//areaTitle.attr("data-cid", thisId);
					cont.find('[data-target="city"]').val(thisId);
					cont.find('[data-target="county"]').val('');
					if (!_self.hideCounty) {
						_self.tabItem("county_list");
						_self.showCity(thisId, "county_list", "t");
					} else {
						_self.hidePanel();
					}
					// 点击市的是把全称放到data内存起来
					cont.attr("data-cid", _this.attr("data-id"));
					cont.attr("data-tid", "");

				} else if (origin == "t") {

					csa["t"] = _this.text();
					//areaTitle.attr("data-tid", thisId);
					cont.find('[data-target="county"]').val(thisId);
					var atitle = csa["p"] + " " + csa["c"] + " " + csa["t"];
					// if (csa["p"] == csa["c"]) {
					// 	atitle = csa["p"] + "/" + csa["t"];
					// }

					$(".county_list").hide();
					isInputText ? areaTitle.val(atitle) : areaTitle.text(atitle);
					_self.hidePanel();

					// 点击县的是把全称放到data内存起来
					cont.attr("data-tid", _this.attr("data-id"));
				}
				_self.o.clickItemFun && _self.o.clickItemFun(_this);
				e.stopPropagation();
			});

			this.selectContainer.on("click", function(e) {
				_self.showPanel();
				e.stopPropagation();
			});

			this.selectContainer.on("click", ".city_close", function(e) {
				_self.hidePanel();
				e.stopPropagation();
			});

			$(document.body).on("click", function() {
				_self.hidePanel();
				selAddList.hide();
			});
		},

		//展开
		showPanel: function() {
			this.selectContent.show();
		},

		//隐藏
		hidePanel: function() {
			this.selectContent.hide();
			this.area_list.hide();
			this.o.hideFun && this.o.hideFun();
		},

		//展示热门城市
		showHotCitys: function(dataArr) {
			//热门城市只写入页面一次
			if (this.loadedHot === false) {
				this.area_list.hide();
				var hotCityCon = this.selectContainer.find(".hot_city");
				var strLists = '<ul class="items clear">';
				for (var i = 0, l = dataArr.length; i < l; i++) {
					var d = dataArr[i];
					strLists += '<li><a href="javascript:;" data-origin="hot" data-id=' + d[0] + '>' + d[1] + '</a></li>';
				}
				strLists += '</ul>';
				hotCityCon.html(strLists).show();
				this.loadedHot = true;
			}
		},

		//显示省份
		showProvince: function(dataObj) {

			//省份只写入页面一次
			var provinceCon = this.selectContainer.find(".province_list");
			if (this.loadedProvince === false) {
				this.area_list.hide();
				var strLists = '<dl class="sort-item clear">';
				for (var i in dataObj) {
					strLists += '<dt>' + i + '</dt><dd class="items">';
					var dataArr = dataObj[i];
					for (var i = 0, l = dataArr.length; i < l; i++) {
						var d = dataArr[i];
						strLists += '<a href="javascript:;" data-origin="p" data-id=' + d[0] + ' data-fullname="' + d[3] + '">' + d[1] + '</a>';
					}
				}
				strLists += '</dd></dl>';
				provinceCon.html(strLists).show();
				this.loadedProvince = true;
			} else {
				provinceCon.show();
			}

			this.selectContainer.find(".city_list").hide();
			this.selectContainer.find(".county_list").hide();

			this.areaTab.find("[data-to='province_list']").addClass("current").siblings().removeClass("current");


		},

		//显示城市和县
		showCity: function(pid, listCls, origin) {

			var allCities = CITIESLIST;
			this.area_list.hide();
			var cityCon = this.selectContainer.find("." + listCls);
			var strLists = '<ul class="items clear">';
			for (var i = 0, l = allCities.length; i < l; i++) {
				var item = allCities[i];
				if (item[2] == pid) {
					strLists += '<li><a href="javascript:;" data-origin=' + origin + ' data-id=' + item[0] + ' data-fullname="' + item[3] + '">' + item[1] + '</a></li>';
				}
			}
			strLists += '</ul>';
			cityCon.html(strLists).show();

		},

		//根据输入的拼音或者汉字匹配城市和县
		showAddList: function(keywords) {
			var allCities = CITIESLIST;
			var that = this;
			that.selectAddList.find('ul').remove();
			var strLists = '<ul>';
			var opt = {
				q: keywords
			};
			$.ajax({
				url: 'http://www.loji.com/place/query',
				data: opt,
				type: 'POST',
				dataType: "jsonp",
				jsonp: "callback",
				success: function(json) {
					var data = json.values.data;
					if (json.code == 0 && data) {
						for (var i = 0; i < data.length; i++) {
							var pCode = data[i].provinceCode;
							var cCode = data[i].cityCode;
							var tCode = data[i].countyCode;
							var name = data[i].name;
							strLists += '<li> <a href="javascript:;" data-pid=' + pCode + ' data-cid=' + cCode + ' data-tid=' + tCode + '>' + name + '</a></li>';
						}
						strLists += '</ul>';
						that.selectAddList.append(strLists);
						that.selectAddList.show();
					} else {
						that.selectAddList.hide();
					}
				}
			});
		},

		//tab切换
		tabChange: function() {
			var cont = this.selectContainer;
			var that = this;
			//获取当前的区域名字
			cont.on("click", "[data-to]", function() {
				var _this = $(this);
				var dataTo = _this.attr("data-to");
				//如果切换到省
				if (dataTo == "province_list") {
					that.showProvince(provinces);
				}
				that.tabItem(dataTo);
			});
		},

		//tab切换效果
		tabItem: function(currentClass) {
			var cont = this.selectContainer;
			cont.find("[data-to]").removeClass("current");
			cont.find(".area_list").hide();
			cont.find('[data-to=' + currentClass + ']').addClass("current");
			cont.find("." + currentClass).show();
		},

		//如果默认的区域有值，根据提供的省、市、县选中列表中的当前元素
		selectCurrentItem: function() {
			var areaTitle = this.areaTitle;
			var cont = this.selectContainer;
			cont.find("[data-id]").removeClass("current");
			var proCode = cont.find('[data-target="province"]').val();
			var cityCode = cont.find('[data-target="city"]').val();
			var countyCode = cont.find('[data-target="county"]').val();

			//选中默认的县
			if (countyCode && countyCode != 'undefined') {
				var currentPanel = cont.find(".county_list");
				currentPanel.find('[data-id=' + countyCode + ']').addClass("current");
			}

			//选中默认城市
			if (cityCode && cityCode != 'undefined') {
				var currentPanel = cont.find(".hot_city");
				currentPanel.find('[data-id=' + cityCode + ']').addClass("current");
				cont.find(".city_list").find('[data-id=' + cityCode + ']').addClass("current");
			}

			//选中默认的省
			if (proCode && proCode != 'undefined') {
				var currentPanel = cont.find(".province_list");
				currentPanel.find('[data-id=' + proCode + ']').addClass("current");
			}

		},

		//如果通过历史记录选择或者手动输入选择填入地址之后，在点击出来的省市县弹层中要对应选中所选的省市县
		showSelectAddress: function(pid, cid, tid) {
			var pid = pid || '';
			var cid = cid || '';
			var tid = tid || '';
			this.showProvince(provinces);
			this.showCity(pid, "city_list", "c");
			this.tabItem('city_list');
			if (cid && cid != 'undefined') {
				this.showCity(cid, "county_list", "t");
				this.tabItem('county_list');
			}
			this.hidePanel();
		},

		// 创建可以存住id的input hide (可以整合到 初始化dom方法里)
		createHideIpt: function() {
			var _self = this;
			var optObj = this.o;
			var optObjHideName = {};
			if (optObj && optObj.hideName) {
				optObjHideName = optObj.hideName;
			}
			var hotcityName = optObjHideName.hotcityName;
			var provinceName = optObjHideName.provinceName;
			var cityName = optObjHideName.cityName;
			var countyName = optObjHideName.countyName;
			var currentPid = this.selectContainer.attr("data-pid");
			var currentCid = this.selectContainer.attr("data-cid");
			var currentTid = this.selectContainer.attr("data-tid");
			//this.areaName.append('<input type="hidden" data-target="hotcity" name=' + (hotcityName || "hotcityName") + ' value="">');
			this.areaName.append('<input type="hidden" data-target="province" name=' + (provinceName || "provinceName") + ' value=' + (currentPid || "") + '>');
			this.areaName.append('<input type="hidden" data-target="city" name=' + (cityName || "cityName") + ' value=' + (currentCid || "") + '>');

			if (this.hideCounty != true) {
				this.areaName.append('<input type="hidden" data-target="county" name=' + (countyName || "countyName") + ' value=' + (currentTid || "") + '>');
			}

			//首次加载的时候pid为空不执行，从首页线路查询跳转之后执行
			// if(currentPid){
			// 	this.showSelectAddress(currentPid,currentCid,currentTid);
			// }
			var _showString = "";
			if (currentPid) {
				_showString += _self.getFullNameByCode(currentPid);
			}
			if (currentCid) {
				_showString += (" " + _self.getFullNameByCode(currentCid));
			}
			if (currentTid) {
				_showString += (" " + _self.getFullNameByCode(currentTid));
			}

			if (_showString) {
				var isInputText = this.areaTitle.is('input[type="text"]');
				isInputText ? this.areaTitle.val(_showString) : this.areaTitle.text(_showString);
			}
		},

		//保存查询历史记录cookie(点击查询的时候执行)
		setHistorySearchCookie: function() {
			var cont = this.selectContainer;
			var _pid = cont.attr('data-pid');
			var _cid = cont.attr('data-cid');
			var _tid = cont.attr('data-tid');

			var _textArr = this.areaTitle.val().split(" ");
			var _text = _textArr[_textArr.length - 1];
			var _oneCitycookieArr = [];
			if (_text) {
				_oneCitycookieArr.push(_text);
			}
			if (_pid) {
				_oneCitycookieArr.push(_pid);
			}
			if (_cid) {
				_oneCitycookieArr.push(_cid);
			}
			if (_tid) {
				_oneCitycookieArr.push(_tid);
			}

			// _oneCitycookieArr.push(_text,_pid,_cid,_tid);
			var cookieStr = _oneCitycookieArr.join(",");
			var _hisCookieString = getCookie("LOJI_cityEnd");
			var _totalCookieArr = [];
			if (_hisCookieString) {
				_totalCookieArr = decodeURI(_hisCookieString).split("|");

			}
			//保证cookie中只保存3历史记录
			if (_totalCookieArr.length < 3) {
				if (_totalCookieArr.length == 0) { //第一个cookie不用比较直接存入
					_totalCookieArr.push(cookieStr);
				} else { //把要存的cookie和已有的进行比较，若已经存在的只保存一次
					this.isRepeatCookie(_totalCookieArr, cookieStr);
					if (!this.historyRepeat) {
						_totalCookieArr.push(cookieStr);
					}
				}
			} else {
				this.isRepeatCookie(_totalCookieArr, cookieStr);
				if (!this.historyRepeat) { //若三个里面没有相同的，删一个添加一个
					_totalCookieArr.shift();
					_totalCookieArr.push(cookieStr);
				}
			}
			var _finalCookieStr = encodeURI(_totalCookieArr.join("|"));
			setCookie("LOJI_cityEnd", _finalCookieStr, 10000);
		},

		// 判断输入的地址是否是有效的
		isCorrectAddress: function() {
			var val = this.areaTitle.val().replace(/(^\s*)|(\s*$)/g, '');
			var csa = this.currentArea;
			if (val != '') {
				var valArr = val.split(' ');
				var len = valArr.length;
				var allCities = CITIESLIST;
				var pCode1 = this.isProCityCounty(valArr[0], allCities, '1000000000');
				if (pCode1) {
					//省正确
					csa['p'] = valArr[0];
					if (valArr[1]) { //如果有市
						var pCode2 = this.isProCityCounty(valArr[1], allCities, pCode1);
						if (pCode2) {
							//市正确
							csa['c'] = valArr[1];
							if (valArr[2]) { //如果有县
								var pCode3 = this.isProCityCounty(valArr[2], allCities, pCode2);
								if (pCode3) {
									//县正确
									csa['t'] = valArr[2];
									this.hideErrorTips();
									this.fillInDataId(pCode1, pCode2, pCode3);
									this.showSelectAddress(pCode1, pCode2, pCode3);
									return true;
								} else {
									this.showErrorTips();
									return false;
								}
							} else if (len == 2) {
								this.hideErrorTips();
								this.fillInDataId(pCode1, pCode2);
								this.showSelectAddress(pCode1, pCode2);
								return true;
							} else {
								this.showErrorTips();
								return false;
							}
						} else {
							this.showErrorTips();
							return false;
						}
					} else if (len == 1) {
						this.hideErrorTips();
						this.fillInDataId(pCode1);
						this.showSelectAddress(pCode1);
						return true;
					} else {
						this.showErrorTips();
						return false;
					}
				} else {
					this.showErrorTips();
					return false;
				}
			} else {
				this.showErrorTips();
				return false;
			}
		},

		//判断输入的省市县是否是正确的，正确的话返回省市县对应的code
		//val 要判断的省市县字符串 cityArr 省市县code表 pCode 父级code
		isProCityCounty: function(val, cityArr, pCode) {
			for (var i = 0; i < cityArr.length; i++) {
				var item = cityArr[i];
				if (val == item[1] && item[2] == pCode) {
					return item[0];
				}
			}
			return false;
		},

		//显示错误提示
		showErrorTips: function() {
			this.areaTips.html('请填写正确的省市区地址');
			this.areaTips.show();
			return false;
		},

		//隐藏错误提示
		hideErrorTips: function() {
			this.areaTips.html('');
			this.areaTips.hide();
			return true;
		},

		//判断要新加入的cookie是否已经存在
		isRepeatCookie: function(arr, str) {
			for (var i = 0; i < arr.length; i++) {
				if (arr[i] == str) {
					this.historyRepeat = true;
					break;
				}
			}
		},

		// 生成搜索记录的dom结构（根据cookie里存的值）
		createHistoryCityDom: function() {
			var that = this;
			var cont = this.selectContainer;
			var areaTitle = this.areaTitle;
			var allcitys = CITIESLIST;
			var csa = this.currentArea;
			var _hisCookieString = getCookie('LOJI_cityEnd');
			if (this.historyShow && _hisCookieString) {
				var _historyArr = decodeURI(_hisCookieString).split('|');
				var _historyStr = '<ul class="history_list">';
				for (var i = 0; i < _historyArr.length; i++) {
					var item = _historyArr[i].split(',');
					_historyStr += '<li data-pid=' + item[1] + ' data-cid=' + item[2] + ' data-tid=' + item[3] + '>' + item[0] + '</li>';
				}
				this.selectContainer.append(_historyStr);
				this.selectContainer.find(".history_list li").bind('click', function(e) {
					var titleStr = '';
					var _this = $(this);
					var pid = _this.attr('data-pid');
					var cid = _this.attr('data-cid');
					var tid = _this.attr('data-tid');
					for (var i = 0; i < allcitys.length; i++) {
						var cityItemArr = allcitys[i];
						if (cityItemArr[0] == pid) {
							titleStr += cityItemArr[1];
							csa["p"] = cityItemArr[1];
						}
					}
					for (var i = 0; i < allcitys.length; i++) {
						var cityItemArr = allcitys[i];
						if (cityItemArr[0] == cid) {
							titleStr += ' ' + cityItemArr[1];
							csa["c"] = cityItemArr[1];
						}
					}
					for (var i = 0; i < allcitys.length; i++) {
						var cityItemArr = allcitys[i];
						if (cityItemArr[0] == tid) {
							titleStr += ' ' + cityItemArr[1];
							csa["t"] = cityItemArr[1];
						}
					}
					areaTitle.val(titleStr);
					that.fillInDataId(pid, cid, tid);
					that.showSelectAddress(pid, cid, tid);
					that.loadedProvince = true;
					e.stopPropagation();
				});
			}
		},

		//手动输入地址或者从历史记录中选择。填充所查询的地址id
		fillInDataId: function(pid, cid, tid) {
			var cont = this.selectContainer;
			var pid = pid || '';
			var cid = cid || '';
			var tid = tid || '';
			cont.attr('data-pid', pid);
			cont.attr('data-cid', cid);
			cont.attr('data-tid', tid);
			cont.find('[data-target="province"]').val(pid);
			cont.find('[data-target="city"]').val(cid);
			cont.find('[data-target="county"]').val(tid);
		},

		// 根据id获取省的名字
		getProNameByCode: function(codeId) {
			if (!codeId) return '';
			codeId += '';
			for (var item in PROVINCELIST) {
				var proArr = PROVINCELIST[item];
				for (var i = 0, l = proArr.length; i < l; i++) {
					if ($.trim(codeId) == proArr[i][0]) {
						return proArr[i][1];
					}
				}
			}
			return '';
		},

		//根据id获取市/县的名字
		getCityNameByCode: function(codeId) {
			if (!codeId) return '';
			codeId += '';
			for (var i = 0, l = CITIESLIST.length; i < l; i++) {
				var cityItemArr = CITIESLIST[i];
				if (codeId == cityItemArr[0]) {
					return cityItemArr[1];
				}
			}
			return '';
		},

		// 根据省的名字获取省的code
		getProCodeByName: function(name) {
			var list = [];
			for (a in PROVINCELIST) {
				list = list.concat(PROVINCELIST[a]);
			}
			for (var i = 0; i < list.length; i++) {
				if (list[i][1] == name || list[i][3] == name) {
					return list[i][0];
				}
			};
			return '';
		},

		// 根据市/县名字获取省的code
		getCityCodeByName: function(name) {
			for (var i = 0; i < CITIESLIST.length; i++) {
				if (CITIESLIST[i][1] == name || CITIESLIST[i][3] == name) {
					return CITIESLIST[i][0];
				}
			};
			return '';
		},

		// 根据名字或者code获取所属的完整的行政区划
		// demo :LOJICity.getRegions("深州") 或者  LOJICity.getRegions("1030903000")
		getRegions: function(str) {
			var _self = this;
			var _reginObj = {};

			for (var i = 0; i < CITIESLIST.length; i++) {
				var checkFlag;
				if (/^1\d{6}000$/.test(str)) {
					checkFlag = ($.trim(str) == CITIESLIST[i][0]);
				} else {
					checkFlag = ($.trim(str) == CITIESLIST[i][1]);
				}

				if (checkFlag) {
					if (CITIESLIST[i][2] == "1000000000") {
						_reginObj.pro = CITIESLIST[i];
						_reginObj.city = "";
						_reginObj.county = "";
					} else {
						var _code = CITIESLIST[i][2];
						var _tmpObj = CITIESLIST[i];
						for (var j = 0; j < CITIESLIST.length; j++) {
							if (_code == CITIESLIST[j][0]) {
								if (CITIESLIST[j][2] == "1000000000") {
									_reginObj.pro = CITIESLIST[j];
									_reginObj.city = _tmpObj;
									_reginObj.county = "";
								} else {

									var __code = CITIESLIST[j][2];
									var __tmpObj = CITIESLIST[j];

									for (var k = 0; k < CITIESLIST.length; k++) {
										if (__code == CITIESLIST[k][0]) {
											if (CITIESLIST[k][2] == "1000000000") {
												_reginObj.pro = CITIESLIST[k];
												_reginObj.city = __tmpObj;
												_reginObj.county = _tmpObj;
											}
										}
									}
								}
							}

						}
					}
				}
			}

			return _reginObj;
		},

		// 根据名字或者code获取所属的完整的行政区划
		// demo :LOJICity.getRegionsSimple("深州") 或者  LOJICity.getRegionsSimple("1030903000")
		getRegionsSimple: function(str) {
			var _self = this;
			var _reginObj = {};

			var areaCode;
			if (/^1\d{6}000$/.test(str)) {
				areaCode = str;
			} else {
				for (var i = 0; i < CITIESLIST.length; i++) {
					if (str == CITIESLIST[i][1]) {
						areaCode = CITIESLIST[i][0];
					}
				}
			}

			var _provinceCode, _cityCode, _countyCode;

			var _proStr = areaCode.substring(0, 3);
			var _cityStr = areaCode.substring(3, 5);
			var _countyStr = areaCode.substring(5, 7);

			if (_cityStr == "00") {
				_provinceCode = areaCode;
				_cityCode = "";
				_countyCode = "";
			} else {
				if (_countyStr == "00") {
					_provinceCode = _proStr + "0000000";
					_cityCode = _proStr + _cityStr + "00000";
					_countyCode = "";
				} else {
					_provinceCode = _proStr + "0000000";
					_cityCode = _proStr + _cityStr + "00000";
					_countyCode = areaCode;
				}
			}

			_reginObj.pro = _self.getAreaDataByCode(_provinceCode);
			_reginObj.city = _self.getAreaDataByCode(_cityCode);
			_reginObj.county = _self.getAreaDataByCode(_countyCode);

			return _reginObj;

		},

		// 根据code返回当条数据
		getAreaDataByCode: function(code) {
			if (!code) return '';
			code += '';
			var resObj = {};
			for (var i = 0; i < CITIESLIST.length; i++) {
				if (code == CITIESLIST[i][0]) {
					resObj = CITIESLIST[i];
					break;
				}
			}
			return resObj;
		},

		// 根据code获取省的名字
		getProFullNameByCode: function(codeId) {
			if (!codeId) return '';
			codeId += '';
			for (var item in PROVINCELIST) {
				var proArr = PROVINCELIST[item];
				for (var i = 0, l = proArr.length; i < l; i++) {
					if ($.trim(codeId) == proArr[i][0]) {
						return proArr[i][3];
					}
				}
			}
			return '';
		},

		// 根据code获取市/县的名字
		getCityFullNameByCode: function(codeId) {

			if (!codeId) return '';
			codeId += '';
			for (var i = 0, l = CITIESLIST.length; i < l; i++) {
				var cityItemArr = CITIESLIST[i];
				if (codeId == cityItemArr[0]) {
					return cityItemArr[3];
				}
			}
			return '';
		},

		// 根据code 返回对应的省市县名字
		getFullNameByCode: function(code) {
			var _self = this;
			var _fullnameString = "";
			if (_self.getProNameByCode(code) === "") {
				_fullnameString = _self.getCityNameByCode(code);
			} else {
				_fullnameString = _self.getProNameByCode(code);
			}
			return _fullnameString;
		},

		// 通过城市Code查找省code   LOJICity.getProvinceCodeByCityCode(1010000000)  1040200000
		getProvinceCodeByCityCode: function(cityCode) {
			var str = "";
			var len = CITIESLIST.length;
			for (var i = 0; i < len; i++) {
				if (CITIESLIST[i][0] == cityCode) {
					str = CITIESLIST[i][2];
					break;
				}
			}
			return str;
		},

		//重置
		/*
         @param {{setTopStr}} 重置后的默认的提示
		*/
		resetSelect: function(setTopStr) {
			if (typeof setTopStr === "undefined") {
				setTopStr = "请选择";
			}
			var cont = this.selectContainer;
			this.areaName.find('input[type="hidden"]').val("");
			cont.attr("data-pid", "");
			cont.attr("data-cid", "");
			cont.attr("data-tid", "");

			var isInputText = this.areaTitle.is('input[type="text"]');
			isInputText ? this.areaTitle.val(setTopStr) : this.areaTitle.text(setTopStr);
			cont.find(".area_list").not(".province_list").html("");
			cont.find(".province_list").show();
			cont.find("[data-to='province_list']").addClass("current").siblings().removeClass("current");
		}

	};

	window.LOJICity = new AreaSelectChange();
	return AreaSelectChange;

})(jQuery, HOTCITYSLIST, PROVINCELIST, CITIESLIST);