  var App={
		uploadForm:function(obj,cb){
			App.page.lock('');
			if(typeof CKEDITOR !="undefined"){
			    for(name in CKEDITOR.instances){
				    if(CKEDITOR.instances[name] && $(obj).find("#"+name).size()>0){
					    $("#"+name).val($("<div/>").text(CKEDITOR.instances[name].getData()).html());
					    CKEDITOR.instances[name].destroy(true);    
				    }
			    }
		    }
			$(obj).upload({
				extradata:false,
				callback:function(data){
					App.page.initPlugin(obj);
					App.page.unlock();
					var result = App.data.parseJSON(data);
					if(!result ){
						bootbox.alert("server response <pre>"+data+"</pre>")
						repaircke();
						App.page.initPlugin(obj);
						return;
					}
					if(result.error){
						bootbox.alert(result.message);
						repaircke();
						App.page.initPlugin(obj);
						return;
					}
					if(cb && typeof cb=="function"){
						cb();
						return;
					}
					App.page.reload()
				}
			})
			function repaircke(){
				$(obj).find("[input-role=ckeditor]").each(function(){
					var val = $(this).val();
					var decoded = $('<div/>').html(val).text();
					$(this).val(decoded);
				});
			}
		},
		action:function(url,postdata,callback){
		    if(App.submitting){return;}
		    App.submitting = true;
		    $.ajax({
                url: url,
                type: 'post',
                data: postdata,
                xhrFields: {
                    withCredentials: true
                },
                success: function (data) {
                    App.submitting = false;
				    callback(data);				    
                },
                error:function(){
                    App.submitting = false;
				    bootbox.alert("Connection Error");    
                }
            });
		},
		getJSON:function(url,data,callback){
		    $.ajax({
                url: url,
                type: "GET",
                data:data,
                dataType: 'json',
                /*xhrFields: {
                     withCredentials: true
                },*/
                success: function (data) {
				    callback(data);
                },
                error:function(){
				    bootbox.alert("Connection Error");    
                }
            });
		},
		getHtml:function(url,data,callback){
		    $.ajax({
                url: url,
                type: "GET",
                data:data,
                xhrFields: {
                     withCredentials: true
                },
                success: function (data) {
				    callback(data);
                },
                error:function(){
				    bootbox.alert("Connection Error");    
                }
            });
		},
		data:{
			cookie:{
                create:function(name,value,min){
                    var expires;
					if (min) {
					    var date = new Date();
						date.setTime(date.getTime() + (min * 60 * 1000));
						expires = "; expires=" + date.toGMTString();
					} else {
					    expires = "";
					}
					document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + expires + "; path=/";
				},
				erase:function(name){
				    App.data.cookie.create(name, "", -1);
				},
				get:function(name){
				    var nameEQ = encodeURIComponent(name) + "=";
				    var ca = document.cookie.split(';');
				    for (var i = 0; i < ca.length; i++) {
					    var c = ca[i];
			    	    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
					    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
				    }
				    return null;
				},
			},
			queryURL:function(stringURL){
				var queries = {};
				if(!stringURL){
					stringURL = document.location.search.substr(1).split('&');
				}
				$.each(stringURL,function(c,q){
					var i = q.split('=');
					queries[i[0].toString()] = i[1].toString();
				});
				return(queries);
			},
			isHTML:function(str) {
				var a = document.createElement('div');
				a.innerHTML = str;
				for (var c = a.childNodes, i = c.length; i--; ) {
					if (c[i].nodeType == 1) return true; 
				}
				return false;
			},
			EncodeEntities:function(s){
				return $j("<div/>").text(s).html();
			},
			DencodeEntities:function(s){
				return $j("<div/>").html(s).text();
			},
			parseJSON:function(data){
				try{
					var objectConstructor = {}.constructor;
					if (data.constructor === objectConstructor){
						return data
					}								
					return JSON.parse(data);
				}catch(e){
					try{
						if (App.data.isHTML(data)){
							data = $(data).text();
							var x  = data.replace(/\r/g, "").replace(/\n/g, "").replace(/\t/g, "");
							try{
								return JSON.parse(x);
							}catch(e){
								var a = document.createElement('div');
								a.innerHTML = str;
								$(a).children().remove();
								return JSON.parse($(a).text());
							}
						}else{
							return JSON.parse(data);
						}
					}catch(e){
						return false;
					}
				}
			},
			str_replace:function(find,replace,str){
				return str.replace(new RegExp(find, 'g'), replace);
			},
			drawimage:function(obj,tgt){
				if (obj.files && obj.files[0]){			
					var reader = new FileReader();
					reader.onload=function(e){
						if ($(tgt).prop('nodeName')=='IMG'){
							$(tgt).attr('src',e.target.result);			
						}else{
							$(tgt).html($(obj).val());
							console.log(e.target);
						}
					}
					reader.readAsDataURL(obj.files[0]);	
				}	
			},
			
		},
		graph:{
		    timeline:function(obj){
		        var urldata = $(obj).attr("flot-urldata")
		        App.getJSON(urldata,{},function(result){
                    if(result.error){
                        $(obj).html(result.message);
                        return;
                    }
                    $(obj).empty();
                    var startDate = parseFloat($(obj).attr("flot-start")) || new Date().getTime();
    		        var endDate = parseFloat($(obj).attr("flot-end")) || new Date().setDate(new Date().getDate() + 1);
    		        var radius = ($(obj).attr("flot-dotradius")) ? parseFloat($(obj).attr("flot-dotradius")) : 1; 
                	$.plot(obj, result.data, {
                		xaxis: { 
                		    mode: "time" ,
                		    timeformat: $(obj).attr("flot-timeformat") || "%d/%m/%Y",
                		    minTickSize: [1, $(obj).attr("flot-tick") || "day"],
                		    min:  startDate ,
    				        max: endDate,
                		},
                		series: {
                			lines: {
                				show: true
                			},
                			points: {
                				show: true,
                				radius: radius
                			}
                		},
                		valueLabels: {
                           show: true
                        }
                	});
		        });
		    },
		    timebar:function(obj){
		        var urldata = $(obj).attr("flot-urldata")
		        App.getJSON(urldata,{},function(result){
                    if(result.error){
                        $(obj).html(result.message);
                        return;
                    }
                    $(obj).empty();
                    var startDate = parseFloat($(obj).attr("flot-start")) || new Date().getTime();
    		        var endDate = parseFloat($(obj).attr("flot-end")) || new Date().setDate(new Date().getDate() + 1);
                	$.plot(obj, result.data, {
                		xaxis: { 
                		    mode: "time" ,
                		    timeformat: $(obj).attr("flot-timeformat") || "%d/%m/%Y",
                		    minTickSize: [1, $(obj).attr("flot-tick") || "day"],
                		    min:  startDate ,
    				        max: endDate,
                		},
                		series: {
                             bars: {
                                 show: true,
                                 barWidth: 60 * 60 * 1000 * (parseFloat($(obj).attr("flot-barscale")|| 1)),
                                 align: 'center'
                             },
                         },
                         yaxes: {
                             min: 0
                         },
                	});
		        });   
		    }
		},
		page:{
			history:[],
			goback:function(){
				window.history.back();
			},
			current:{
				page:false,
				object:false,
			},
			request:function(page){
				var hast = location.hash.substr(1);
				if(hast!=page){
					location = location.pathname +'#'+page;
				}else{
					App.page.render(page,"#page-content",App.page.onRender);
				}
				App.page.current.page = page;
				App.page.current.object = '#page-content';
			},
			render:function(page,target,callback){
				if(!target || $(target).size() <1){
					alert("error, no target");
					return;
				}
				if($(target).attr('loading') && $(target).attr('loading')=="true"){
				    return;
				}
				$(target).attr('loading','true');
				$(target).html("loading");
				App.page.destroyPlugin(target);
				$(target).empty();
				
				$(target).load(page,function(response, status, xhr){	
				    $(target).removeAttr('loading');
					if (status == "error") {
						alert('Error loading page '+page);
						return;
					}			
					App.page.initPlugin(target);
					if(callback && typeof callback=="function"){
						callback();
					}
					$('body').attr('class','');
				});				
			},
			reload:function(callback){
				var current = App.page.current
				if (current.page && current.object){
				    App.page.destroyPlugin(current.object);
    				$(current.object).load(current.page,function(response, status, xhr){	
    					if (status == "error") {
    						alert('Error loading page '+page);
    						return;
    					}			
    					$(current.object).attr('loaded','true');
    					
    					App.page.initPlugin(current.object);
    					
    					if(callback && typeof callback=="function"){
    						callback();
    					}
    					if(App.page.onRender && typeof App.page.onRender=="function"){
					        App.page.onRender();
					    }
    					$('body').attr('class','');
    				});	
				}
			},
			lock:function(text){
			    if(App.page.isLocked){return;}
			    App.page.isLocked =  true;
				$('body').append('<div id="lock_curtain" style="position:fixed;left:0;top:0;width:100%;height:100%;background:black;opacity:0.9;filter: alpha(opacity=90);color:white;z-index:9999;text-align:center;"><h2 style="margin-top:10%">'+text+'<br> PLEASE WAIT</h2></div>');		
			},
			unlock:function(){
				$('body').attr('class','');
				$("#lock_curtain").remove();
				App.page.isLocked =  false;
			},
			initPlugin:function(elem){
			    if(!elem){
    		        elem = 'body';
    		    }
				$(elem).find("[input-role=alphanum]").each(function(){
					var spaces = ($(this).attr("allow-spaces")=="true") ? true : false;
					var chars = $(this).attr("allow-chars");
					$(this).alphanum({
						allowSpace: spaces,
						allow :chars,
					});
				});
				$(elem).find("[character-limit]").each(function(){
					var limit = parseInt($(this).attr("character-limit"));
					if(limit >0){
						$(this).inputlimiter({limit: limit});
					}
				});
				$(elem).find("[input-role=img]").each(function(){
					var selem = this;
					
					if(jQuery.data( selem, "initialized" )){
						return;
					}
					jQuery.data( selem, "initialized",true);
					var input = $(this).find("input");
					$(this).find("img").click(function(){
						$(input).trigger('click');
					});
					$(this).find(".btn").click(function(){
						$(input).trigger('click');
					});
					$(this).find("input").change(function(){
						try{
							var height = parseFloat($(this).attr("data-height")||0);
							var width = parseFloat($(this).attr("data-width")||0);
							
							var maxheight = parseFloat($(this).attr("data-maxheight")||0);
							var maxwidth = parseFloat($(this).attr("data-maxwidth")||0);
							
							var minheight = parseFloat($(this).attr("data-minheight")||0);
							var minwidth = parseFloat($(this).attr("data-minwidth")||0);
							
							var maxSize = parseFloat($(this).attr("data-max-size")||0);
						
						
							var obj = this;
							var reader = new FileReader();
							var image  = new Image();
							var F = this.files[0];
							reader.readAsDataURL(this.files[0]); 
							reader.onload = function(_file) {
								image.src    = _file.target.result;
								image.onload = function() {
									var w = this.width,
									h = this.height,
									t = F.type,
									n = F.name,
									s = ~~(F.size/1024) +'KB';
									var sz = (F.size/1024);
									if(maxSize && sz > maxSize){
										show_error(obj,'Mohon gunakan foto dengan ukuran maksimum '+maxSize+'KB ');
										return;
									}
									if(minwidth && w < minwidth){
										show_error(obj,'Please check your image specs and/or file size again, image width must bigger or equal than : '+minwidth+' px');
										return;
									}
									if(minheight && h < minheight){
										show_error(obj,'Please check your image specs and/or file size again, image height must bigger or equal than : '+minheight+' px');
										return;
									}
									if(maxwidth && w > maxwidth){
										show_error(obj,'Please check your image specs and/or file size again, image width must smaller or equal than : '+maxwidth+' px');
										return;
									}
									if(maxheight && h > maxheight){
										show_error(obj,'Please check your image specs and/or file size again, image height must smaller or equal than : '+maxheight+' px');
										return;
									}
									if(width && w != width){
										show_error(obj,'Please check your image specs and/or file size again, image width must  equal to : '+width+' px');
										return;
									}
									if(height && h != height){
										show_error(obj,'Please check your image specs and/or file size again, image height must  equal to : '+height+' px');
										return;
									}
									if($(selem).attr("multiple") && $(selem).nextAll().size()<1){
										var html = $(selem).clone().wrap('<div>').parent().html();
										$(selem).parent().append(html);
										App.page.initPlugin($(selem).parent());
									}
									App.data.drawimage(obj,$(obj).prev());
								};
								image.onerror= function() {
									bootbox.alert('Invalid file type: '+ file.type);
									return;
								};      
							};
						}catch(e){
							
						}
					});
					function show_error(obj,message){
						$(obj).prev().attr('src',$(obj).attr('data-prev-src'));
						$(obj).val('');
						bootbox.alert(message);
					}
				});
    		    $(elem).find("div[input-role=daterangepicker]").each(function(){
    		        var obj = this;
    		        function cb(start, end){
                        $(obj).find("span").html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
                        $(obj).attr("date-start",start.format("YYYY-MM-DD"));
                        $(obj).attr("date-end",end.format("YYYY-MM-DD"));
                        $(obj).trigger("onchange");
                    }
                    var start = moment(new Date($(obj).attr("date-start"))) || moment();
			        var end = moment(new Date($(obj).attr("date-end"))) || moment().endOf("month");
			        
			        $(obj).find("span").html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
                    $(obj).daterangepicker({},cb);
    		    })
    		    $(elem).find("[elem-role=flot]").each(function(){
    		        var obj = this
    		        var flot_type=$(this).attr("flot-type");
                    try{
    		            App.graph[flot_type](obj);
                    }catch(e){
                        console.log(e);
                    }
    		    })
    		    $(elem).find("select[input-role=select-ajax]").each(function(){
    		        var obj = this;
					$(obj).empty();
    		        var url = $(obj).attr("ajax-url");
    		        var opt_value = $(obj).attr("option-value");
    		        var opt_text = $(obj).attr("option-text");
    		        var value = $(obj).attr("data-value");
    		        App.getJSON(url,{},function(result){
    		            var select = $(obj);
    		            for(var i in result){
    		                var options = $('<option/>');
    		                options.val(result[i][opt_value]).text(result[i][opt_text]);
    		                if (value == result[i][opt_value]){
                                options.attr('selected', 'selected');
                            }
                            select.append(options);
    		            }
    		        })
    		    })
    		    $(elem).find("[elem-role=ajax-html]").each(function(){
            	    var obj = this;
            	    App.getHtml($(obj).attr("elem-url"),{},function(data){
            	        $(obj).html(data);
            	        App.page.initPlugin(obj);
            	    })
            	});
				$(elem).find("[input-role=image-picker]").each(function(){
					$(this).imagepicker();
				});
            	$(elem).find("[input-role=yearpicker]").each(function(){
    		        var obj  = this;
    		        $(obj).yp({
    		            mode:"year",
    		            yearStart:parseFloat($(obj).attr("year-start")) || 0,
    		            yearEnd:parseFloat($(obj).attr("year-end")||0),
    		            wrap:$(obj).attr("wrap") || false,
    		        });
    		    });
    		    $(elem).find("[input-role=quarteryearpicker]").each(function(){
    		        var obj  = this;
    		        $(obj).yp({
    		            mode:"quarter",
    		            yearStart:parseFloat($(obj).attr("year-start")) || 0,
    		            yearEnd:parseFloat($(obj).attr("year-end")||0),
    		            wrap:$(obj).attr("wrap") || false,
    		        });
    		    });
    		    $(elem).find("[input-role=scrollable]").each(function(){
    		        $(this).scrollable();
    		    });
			    $(elem).find("[input-role=ckeditor]").each(function(){
					var id = $(this).attr("id");
					if(!id){
						id = "cke-"+Math.random().toString(36).substring(7);
			            $(this).attr("id",id);
                    }
			        try{
			            if(CKEDITOR){
        			        for(i in CKEDITOR.instances){
        			            if(CKEDITOR.instances[i] && i==id){
        			                CKEDITOR.instances[i].destroy(true);    
        			            }
                            }
        			    }
			        }catch(e){
			            console.log(e);
			        }
			        var toolbar = $(this).attr("cke-toolbar") || "Basic";
			        CKEDITOR.replace( id,{toolbar : toolbar,});
			    });
			    $(elem).find("[input-role=number-spinner]").each(function(){
			        try{
    			        var obj = this;
    			        $(this).keypress(function(){return false;})
    			        $(obj).TouchSpin({
                            verticalbuttons: true
                        });
                        $(obj).attr("onkeypress","return event.charCode >= 48 && event.charCode <= 57");
			        }catch(e){
			            console.log(e);
			        }
			    })
			    $(elem).find("[input-role=sumo-select]").each(function(){
			        try{
    			        var obj = this;
    			        var placeholder = $(this).attr("placeholder") || "";
						var url = $(obj).attr("ajax-url");
						if(url){
							var opt_value = $(obj).attr("option-value");
							var opt_text = $(obj).attr("option-text");
							var value = $(obj).attr("data-value");
							App.getJSON(url,{},function(result){
								var select = $(obj);
								for(var i in result){
									var options = $('<option/>');
									options.val(result[i][opt_value]).text(result[i][opt_text]);
									if (value && value == result[i][opt_value]){
										options.attr('selected', 'selected');
									}
									select.append(options);
								}
								$(obj).SumoSelect({placeholder:placeholder});
							})
						}else{
							$(obj).SumoSelect({placeholder:placeholder});
						}
						
			        }catch(e){
			            console.log(e);
			        }
			    });
			    $(elem).find("[input-role=money]").each(function(){
			        try{
    			        var obj = this;
    			        $(this).maskMoney();
			        }catch(e){
			            console.log(e);
			        }
			    })
			    $(elem).find('[input-role=datepicker]').each(function(){
			        try{
    			        var obj = this;
						var format = $(this).attr('date-format') || false;
						
    			        $(this).keypress(function(){return false;})
						$(this).datetimepicker({
							format:format
						}); 
                        $(obj).on('changeDate', function(e) {
                            $(obj).parent().trigger('click');
							$(obj).datetimepicker('hide')
                        });
			        }catch(e){
			            console.log(e);
			        }
			    });
				 $(elem).find('[input-role=datetimepicker]').each(function(){
			        try{
    			        var obj = this;
						var format = $(this).attr('date-format') || false;
    			        $(this).keypress(function(){return false;})
						$(this).datetimepicker({
							format:format
						});
			        }catch(e){
			            console.log(e);
			        }
			    });
			    $(elem).find('[input-role=clockpicker]').each(function(){
			        try{
    			        var obj = this;
    			        $(this).keypress(function(){return false;})
    			        $(this).clockpicker({
    			           donetext: 'Set',
    			           afterDone:function(){
    			                $(obj).parent().trigger('click');
    			           }
    			        }); 
			        }catch(e){
			            console.log(e)
			        }
			    });
			    $(elem).find('[input-role=tokenize-ajax]').each(function(){
			        try{
			            var obj = this;
    			       	$(this).tokenize({
                            datas: $(this).attr("data-url"),
                            onAddToken:function(val,text,e){
                                if($(obj).attr("onchange")){
                                    $(obj).trigger("change");
                                }
                            },
                        });
			        }catch(e){
			            console.log(e)
			        }
			    });
                $(elem).find('[input-role=tokenize]').each(function(){
			        try{
			            var obj = this;
    			       	$(this).tokenize({
                            onAddToken:function(val,text,e){
                                if($(obj).attr("onchange")){
                                    $(obj).trigger("change");
                                }
                            },
                        });
			        }catch(e){
			            console.log(e)
			        }
			    });
			    $(elem).find('[input-role=timepicker]').each(function(){
			        try{
    			        $(this).keypress(function(){return false;})
    			        $(this).datetimepicker({
                          pickDate: false
                        });
    			        $(this).find('input').click(function(){
                            $(this).next(".add-on").trigger('click');
                        })
			        }catch(e){
			            console.log(e)
			        }
			    });
			    ;
			    $(elem).find('[data-toggle="tooltip"]').each(function(){
			        try{
			            $(this).tooltip('destroy');  
			            $(this).tooltip();
			        }catch(e){
			            console.log(e)
			        }
			    })

    			$(elem).find("[input-role=bootstrap-switch]").each(function(){
    			    try{
        			    $(this).bootstrapSwitch('destroy', true);
        				$(this).bootstrapSwitch();
        				var onLabel = $(this).attr("on-label");
        				if(onLabel){
        					$(this).bootstrapSwitch('setOnLabel',onLabel);
        				}
        				var offLabel = $(this).attr("off-label");
        				if(offLabel){
        					$(this).bootstrapSwitch('setOffLabel',offLabel);
        				}
        				var offClass = $(this).attr("off-class");
        				if(offClass){
        					$(this).bootstrapSwitch('setOffClass',offClass);
        				}
        				var sizeClass = $(this).attr("size-class");
        				if(sizeClass){
        					$(this).bootstrapSwitch('setSizeClass',sizeClass);
        				}
    			    }catch(e){
    			        console.log(e);
    			    }
    
    			});
    			$(elem).find("[input-role=inputmask]").each(function(){
    			    try{
        				var format = $(this).attr("input-mask-format");
						switch(format){
							case "phone":
							alert($(this).attr("input-mask-phone-url"));
								$(this).inputmask(format, {
								  url: $(this).attr("input-mask-phone-url"),
								  onKeyValidation: function () { //show some metadata in the console
									console.log($(this).inputmask("getmetadata")["city"]);
								  }
								});
							break;
							default:
								$(this).inputmask(format);
							break;
						}
        				
    			    }catch(e){
    			        console.log(e)
    			    }
    			});
    			$(elem).find("select[input-role=select2]").each(function(){
    			    try{
        			    $(this).select2("destroy")
        				$(this).select2();
    			    }catch(e){
    			        console.log(e)
    			    }
    			});
    			
    			$(elem).find("input[input-role=select2]").each(function(){
    			    try{
        				var obj = this;
        				$(this).select2("destroy")
        				var cb =false;
        				if($(obj).attr('data-value-id') && $(obj).attr('data-value-text')){
        				    cb = { id: $(obj).attr('data-value-id'), text: $(obj).attr('data-value-text') }   
        				}
        				var prev_data = $(this).attr('select2-prev-data');
						
        				if(prev_data && prev_data!=""){
        				    try{
        				        cb = JSON.parse($(this).attr('select2-prev-data'));
        				    }catch(e){
        				        cb = false
        				    }
        				}
        				$(obj).select2({
        					placeholder: $(obj).attr('placeholder'),
        					minimumInputLength: 1,
        					initSelection: function (element, callback) {
        					    if(cb){
        						    callback(cb);
        					    }
        					},
        					multiple:($(obj).attr("data-multiple")) ? true:false,
        					ajax: { 
        						url: $(obj).attr('data-url'),
        						 params: {
                                    xhrFields: { withCredentials: true }
                                },
        						dataType: 'json',
        						quietMillis: 250,
        						data: function (term, page) {
        							return {
        								q: term,
        							};
        						},
        						results: function (data, page) {
        							return { results: data }
        						},
        						cache: true
        					},
        				});
						if(cb){
							$(obj).select2("data", cb);
						}
    			    }catch(e){
    			        console.log(e)
    			    }
    			});
    			$(elem).find('[input-role=intl-tel-input]').each(function(){
    			    try{
    			        var obj = this;
        			    $(this).intlTelInput("destroy");
        			    $(this).intlTelInput({
                            defaultCountry: "auto",
                            geoIpLookup: function(callback) {
                                $.get('http://ipinfo.io', function() {}, "jsonp").always(function(resp) {
                                  var countryCode = (resp && resp.country) ? resp.country : "";
                                  callback(countryCode);
                                });
                            },
                            utilsScript: "http://cdn.ibusinesshero.com/assets/plugins/intl-tel-input/js/utils.js"
                        });
    			        
    			    }catch(e){
    			        console.log(e)
    			    }
                    
    			});
    
    			$(elem).find("[input-role=numbersonly]").each(function(){
    				$(this).attr("onkeypress","return event.charCode >= 48 && event.charCode <= 57");
    			});
    			
    			$(elem).find("[data-action=href]").each(function(){
    				var href = $(this).attr("data-href");
    				$(this).off( "click" );
    				if(href && href!=""){
    					$(this).on("click",function(){
    						document.location = href;
    						$(this).off("click");
    					});
    					
    				}
    			});
    			
    			$(elem).find('[data-event=keyup-return]').each(function(){
    				var obj = this;
    				var trigger_id = $(this).attr('keyup-trigger');
    				if(!trigger_id || trigger_id==""){return;}
    				$(this).off( "keyup" );
    				$(this).keyup(function(e){
    					if ( e.keyCode ==13){
    					    trigger(obj,trigger_id);
    					}
    				});
    			});
    			$(elem).find('[data-event=keypress-return]').each(function(){
    				var obj = this;
    				var trigger_id = $(this).attr('keypress-trigger');
    				if(!trigger_id || trigger_id==""){return;}
    				$(this).off( "keypress" );
    				$(this).keypress(function(e){
    					if ( e.keyCode ==13){
    						trigger(obj,trigger_id);
    					}
    				});
    			});
    			$('[data-event=focus-out]').each(function(){
    				var obj = this;
    				$(this).off( "focusout" );
    				var trigger_id = $(this).attr('focus-trigger');
    				if(!trigger_id || trigger_id==""){return;}
    				
    				$(this).focusout(function(){
    					trigger(obj,trigger_id);
    				});
    			});
    			function trigger(obj,trigger_id){
    			    if($(obj).siblings('*[trigger-id='+trigger_id+']').size() > 0){
    					   $(obj).siblings('*[trigger-id='+trigger_id+']').trigger('click');
    				    return
    				}
    				if($(obj).parent().siblings('*[trigger-id='+trigger_id+']').size() > 0){
    				    $(obj).parent().siblings('*[trigger-id='+trigger_id+']').trigger('click');
    				    return;
    				}
    				if($(obj).parent().parent().siblings('*[trigger-id='+trigger_id+']').size() > 0){
    				    $(obj).parent().parent().siblings('*[trigger-id='+trigger_id+']').trigger('click');
    				    return;
    				}
    			}
    		},
    		destroyPlugin:function(elem){
    		    if(!elem){
    		        elem = 'body';
    		    }
    		    try{
        		    if(CKEDITOR){
    			        for(name in CKEDITOR.instances){
							var id = '#'+name;
							
                            if(CKEDITOR.instances[name] && $(elem).find(id).size()>0){
								$(id).html(CKEDITOR.instances[name].getData());
        			            CKEDITOR.instances[name].destroy(true);
        			        }
                        }
    			    }
    		    }catch(e){}
			    try{
    		        $(elem).find('[data-toggle="tooltip"]').tooltip('destroy');
			    }catch(e){}
				
			    try{
        		    $(elem).find("[input-role=bootstrap-switch]").each(function(){
        		        $(this).bootstrapSwitch('destroy', true);
        		    });
			    }catch(e){}
				
			    try{
        			$(elem).find("[input-role=select2]").each(function(){
        			    var data = JSON.stringify($(this).select2('data'));
        			    $(this).attr('select2-prev-data',data)
        				$(this).select2("destroy")
        			});
			    }catch(e){}
				
			    try{
        			$(elem).find('[input-role=intl-tel-input]').each(function(){
        			    $(this).intlTelInput("destroy");
        			})
			    }catch(e){}
				 try{
        			$(elem).find('[input-role=datepicker]').each(function(){
					   $(this).datepicker('remove');
					});
			    }catch(e){}
				
    		}
		},		
	}
