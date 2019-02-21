$(window).on('hashchange', function() {
	cms.init();
});
$(document).ready(function(){
	cms.init();
    if(Metronic){
            Metronic.init();
        }
})
var cms = {
    init: function () {
        var hast = location.hash.substr(1);
        if (hast !== '') {
            App.page.request(hast);
        }
    },
    makePath: function (path) {
        return cms.urlPath + path.replace("~","");
    },
    switchDisplayToNext:function(obj){
		$(obj).next().slideDown();
		$(obj).slideUp();
	},
	switchDisplayToPrev:function(obj){
		$(obj).prev().slideDown();
		$(obj).slideUp();
	},
}
var pages={
	addnewparam:function(obj,page){
		App.page.lock('');

		$(obj).parent().prev().upload({
			extradata:{pages:page},
			callback:function(data){
				App.page.unlock('');
				var result = App.data.parseJSON(data);
				if(!result ){
					bootbox.alert("server response <pre>"+data+"</pre>")
					return;
				}
				if(result.error){
					bootbox.alert(result.message);
					return;
				}
				location.reload();
			}
		})
	},
	selectType:function(obj){
		var val=$(obj).val();
		$("#myModal div[control-type]").hide();
		$("#myModal div[control-type*="+val+"]").show();
	},
	update:function(obj,p){
		App.page.lock('');
        if(CKEDITOR){
			for(name in CKEDITOR.instances){
				if(CKEDITOR.instances[name]){
					$("#"+name).val($("<div/>").text(CKEDITOR.instances[name].getData()).html());
					CKEDITOR.instances[name].destroy(true);    
				}
			}
		}
		$(obj).parent().parent().parent().upload({
			extradata:{pages:p},
			callback:function(data){
				App.page.unlock('');
				$("[input-role=ckeditor]").each(function(){
                    $(this).val($("<div/>").html($(this).val()).text())
                })
                App.page.initPlugin($(obj).parent().parent().parent());
				var result = App.data.parseJSON(data);
				if(!result ){
					bootbox.alert("server response <pre>"+data+"</pre>")
					return;
				}
				if(result.error){
					bootbox.alert(result.message);
					return;
				}
				location.reload();
			}
		})

	}
}

var admin = {
    login: function () {
        $('#loginfrm').upload({
            extradata: false,
            callback: function (data) {
                var result = App.data.parseJSON(data);
                if (!result) {
                    bootbox.alert('fail to parse json <br>Server returned :<br><pre>' + data + '</pre>');
                    return;
                }
                if (!result.error) {
                    location.reload();
                } else {
                    bootbox.alert(result.message);
                }
            }
        });
    },
    logout: function () {
        App.data.cookie.erase('adminsid');
        top.location = cms.makePath("admin");
    },
    changePassword: function () {
        bootbox.prompt("masukkan password lama ", function (oldpassword) {
            if (!oldpassword) { return; }
            bootbox.prompt("masukkan password baru ", function (newpassword) {
                if (!newpassword) { return; }
                App.page.lock("Updating");
                App.action(cms.makePath('api/admin/changePassword'), { oldpassword: oldpassword, newpassword: newpassword }, function (data) {
                    App.page.unlock();
                    var result = App.data.parseJSON(data);
                    if (!result) {
                        bootbox.alert('server error returned:<pre>' + data + '</pre>');
                        return;
                    }
                    bootbox.alert(result.message, function () {
                        if (!result.error) {
                            location.reload();;
                        }
                    });
                });

            })
        })
    },
    action:function(obj,id){
            var val = $(obj).val();
            switch(val){
                case "reset":
                    admin.reset(id);
                break;
                case "edit":
                    admin.read(id);
                break;
                case "remove":
                    admin.remove(id);
                break;
            }
			$(obj).val('0');
        },
        addnew:function(){
			App.page.lock("Updating");
            $("#frmadmin form").attr("action",cms.makePath("api/admin/addnew"));
            $("#frmadmin").upload({
                extradata:false,
                callback:function(data){
                    App.page.unlock();
                    var result = App.data.parseJSON(data);
                    if(!result){
                        bootbox.alert('server error returned:<pre>'+data+'</pre>');
                        return;
                    }   
                    bootbox.alert(result.message,function(){
						if(!result.error){
							location.reload();;
						}
					});
                }
            });
        },
        read:function(id){
            App.page.lock("fething data");
            App.action(cms.makePath('api/admin/read'),{id:id},function(data){
                App.page.unlock();
                var result = App.data.parseJSON(data);
                if(!result){
                    bootbox.alert('server error returned:<pre>'+data+'</pre>');
                    return;
                }  
                $("#frmadmin").find('input[name=email]').val(result.data.email);
				$("#frmadmin").find('select[name=level]').val(result.data.level);
                $("#frmadmin").find('button[role=submit]').attr('onclick','admin.update('+"'"+id+"'"+')');
				$('#frmadmin').slideDown();
				$('#adminlist').css({display:'none'});
            });
        },
        update:function(id){
			
			App.page.lock("Updating");
			try {
				App.data.ckeditor.destroy();
				App.data.ckeditor = false;
			} catch (e) {
				App.data.ckeditor = false;
			}
            $("#frmadmin form").attr("action",cms.makePath("api/admin/update"));
            $("#frmadmin").upload({
                extradata:{action:"update",id:id},
                callback:function(data){
                    App.page.unlock();
                    var result = App.data.parseJSON(data);
                    if(!result){
                        bootbox.alert('server error returned:<pre>'+data+'</pre>');
                        return;
                    }   
                    bootbox.alert(result.message,function(){
						if(!result.error){
							location.reload();;
						}
					});
                }
            });
        },
		remove:function(id){
			bootbox.confirm('lanjut hapus admin ini ?',function(ok){
				if(!ok){return;}
				App.page.lock("Updating");
				App.action(cms.makePath('api/admin/remove'),{id:id},function(data){
					App.page.unlock();

					var result = App.data.parseJSON(data);
					if(!result){
						bootbox.alert('server error returned:<pre>'+data+'</pre>');
						return;
					}
					bootbox.alert(result.message,function(){
						if(!result.error){
							location.reload();;
						}
					});
				});
			});
		},
        reset:function(id){
				App.page.lock("Updating");
				App.action(cms.makePath('api/admin/reset'),{id:id},function(data){
					App.page.unlock();

					var result = App.data.parseJSON(data);
					if(!result){
						bootbox.alert('server error returned:<pre>'+data+'</pre>');
						return;
					}
					bootbox.alert(result.message,function(){
						if(!result.error){
							location.reload();;
						}
					});
				});
		}
}
