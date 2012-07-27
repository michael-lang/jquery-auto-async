/*
* Copyright (c) 2012 Michael Lang
* portions as noted below Copyright (c) 2010 Maxim Vasiliev
* https://github.com/maxatwork/form2js/blob/master/src/form2js.js
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
* THE SOFTWARE.
*
* @author: Michael Lang (Github:michael-lang)
*/
/*
* Nexul jQuery extensions 1.0.0
*
* Depends:
*    jquery 1.6.2+
*    jquery.ui.widget.js 1.8.14+
*    jquery.ui.button.js 1.8.14+
*    jquery.validate.js 1.8.14+
*    form2js
*/
if (!Nexul) { var Nexul = {}; }
if (!Nexul.Shared) { Nexul.Shared = {}; }

Nexul.Shared.AJAXForm = function () {
	function ResultMessage(prms) {
		if (!prms || !prms.element) { return; }
		var doneMarkup = $("<span></span>")
			.html(prms.message ? prms.message : "Success")
			.attr("data-rand", Math.random());
		if (prms.success) {
			prms.element.find(".msg").addClass("ui-state-highlight").removeClass("ui-state-error").append(doneMarkup);
			doneMarkup.fadeOut(prms.success ? 5000 : 30000, function () {
				prms.element.find(".msg").empty();
			});
		} else {
			prms.element.find(".msg").addClass("ui-state-error").removeClass("ui-state-highlight").append(doneMarkup);
		}
	};
	function Post(eventSource, callback) {
		var ajaxParams = {},
			eventParams = {},
			waitDialog = $("#wait-dialog");
		if (eventSource instanceof jQuery || eventSource.split) {
			$.extend(ajaxParams, { source: $(eventSource) });
		} else {
			$.extend(ajaxParams, eventSource);
		}
		if (ajaxParams.source) {
			var disableWaitMsg = ajaxParams.source.data("ajax-submit-wait-message-disable");
			if (!disableWaitMsg) {
				var waitMsg = ajaxParams.source.data("ajax-submit-wait-message");
				if (waitMsg == undefined) { waitMsg = "Please wait..."; }
				waitDialog = $('<div id="wait-dialog">' + waitMsg + '</div>').appendTo('body');
				$(waitDialog).dialog({ modal: true });
			}
		}

		if (!ajaxParams.url) {
			var formUrl;
			if (ajaxParams.form instanceof jQuery) {
				formUrl = ajaxParams.form.attr("action");
			} else if (ajaxParams.source instanceof jQuery && ajaxParams.source.data("ajax-submit-url")) {
				formUrl = ajaxParams.source.data("ajax-submit-url");
			}
			$.extend(ajaxParams, { url: formUrl });
		}
		if (!ajaxParams.data) {
			if (!ajaxParams.form && ajaxParams.source instanceof jQuery) {
				$.extend(ajaxParams, { form: $(ajaxParams.source).closest('form').first() });
			}
			if (ajaxParams.form instanceof jQuery) {
				var formData = ajaxParams.form.serialize();
				if (ajaxParams.source instanceof jQuery && ajaxParams.source.is(":button,:submit")) {
					if (formData.length > 0 || ajaxParams.url.indexOf("?") > -1) { formData += "&"; }
					else { formData += "?"; }
					formData += ajaxParams.source.attr("id") + "=" + ajaxParams.source.attr("id");
					ajaxParams.form.find('#__EVENTTARGET').val(ajaxParams.source.attr("id"));
				}
				$.extend(ajaxParams, { data: formData });
			}
		}

		$.extend(eventParams, ajaxParams);
		ajaxParams = $.extend({
			cache: false,
			type: "post",
			success: function (msg) {
				if ($.isFunction(callback)) {
					callback(msg);
				}
				if (msg.success == false) {
					$("body").trigger("ajax-post-fail", $.extend({}, ajaxParams, { result: msg }));
				} else {
					$("body").trigger("ajax-post-success", $.extend({}, ajaxParams, { result: msg }));
				}
				$(waitDialog).dialog("close").dialog("destroy").remove();
			},
			error: function (jqXHR, textStatus, errorThrown) {
				var msg = {
					success: false,
					message: "Server side call failed. " + errorThrown
				};
				if ($.isFunction(callback)) {
					callback(msg);
				}
				$("body").trigger("ajax-post-fail", $.extend({}, ajaxParams, { result: msg }));
				$(waitDialog).dialog("close").dialog("destroy").remove();
			}
		}, ajaxParams);
		if (ajaxParams.data && ajaxParams.url) {
			$("body").trigger("before-ajax-post", eventParams);
			$.ajax(ajaxParams);
		} else if ($.isFunction(callback)) {
			callback({ success: false, message: "Server side connection not available at this time." });
		}
	};
	return {
		Post: Post,
		ResultMessage: ResultMessage
	};
} ();

Nexul.Shared.AJAXDialog = function () {
	var enabled = false;
	function enable() {
		enabled = true;
	};
	function init() {
		enable();
		Enhance($(document));
	};

	function Enhance(section) {
		if (!enabled) { return; }
		ForceEnhance(section);
	};
	function ForceEnhance(section) {
		$(section).find(":submit.ajax-submit").closest("form").submit(function () {
			return false;
		});
		$(section).find(":submit.ajax-submit").click(function (event) {
			event.preventDefault();
			Post($(event.target));
		});
	}

	function Post(eventSource) {
		var theform = $(eventSource).closest('form').first();
		var theDialog = $(theform).parents(".ui-dialog");

		theform.find(".msg").hide().empty();

		Nexul.Shared.AJAXForm.Post({ source: eventSource, form: theform }, function (msg) {
			if (msg.success == true) {
				theform.find(".msg").addClass("success ui-state-highlight").removeClass("ui-state-error");
				if (msg.message) {
					theform.find(".msg").html(msg.message).show();
				} else {
					theform.find(".msg").html("Success").show();
				}
				if (!msg.preventClose) {
					setTimeout(function () {
						$(theDialog).dialog("close").dialog("destroy").remove();
					}, 1000); //wait one second to run close function
				}
			} else if (msg.success == false) {
				theform.find(".msg").addClass("ui-state-error").removeClass("success ui-state-highlight");
				theform.find(".msg").html(msg.message).show();
			} else {
				$(theDialog).dialog("destroy").remove();
				Nexul.Shared.jQueryUIAutoEnhance.CreateDialog(msg);
			}
		});
	};
	return {
		enable: enable,
		init: init,
		Enhance: Enhance,
		ForceEnhance: ForceEnhance,
		Post: Post
	};
} ();

//requires the validate plugin, otherwise this will always return true.
Nexul.Shared.validate = function () {
	function isValid(elm) {
		return ($(elm).parents("form") == undefined
			|| $(elm).parents("form").validate == undefined
			|| $(elm).parents("form").validate().element(elm) == undefined
			|| $(elm).parents("form").validate().element(elm));
	};
	function isValidForm(elm) {
		var valid = true;

		if ($(elm).parents("form") == undefined
			|| $(elm).parents("form").validate == undefined) {
			return true;
		}
		$(elm).parents("form").find(":input:not(:hidden)").each(function (index, el) {
			if (el.is(":not(:visible)")) {
				el.val("");
			}

			if (el.val() != "" || el.hasClass('required')) {
				if (el.attr("nodeName") != "/INPUT") {
					if (!this.parents("form").validate().element(this)) {
						valid = false;
					}
				}
			}
		});

		return valid;
	};
	return {
		isValid: isValid,
		isValidForm: isValidForm
	};
} ();

Nexul.Shared.jQueryUIAutoEnhance = function () {
	function init() {
		Enhance($(document));
	};

	function AnchorAsDialog(anchor) {
		anchor = $(anchor);
		var url = anchor.attr("href");
		if (url.indexOf("?") != -1) { url += "&d=1"; } else { url += "?d=1"; }
		$.get(url, function (data, textStatus, jqXHR) {
			if (textStatus == "success") {
				CreateDialog(data);
			} else {
				/*TODO: should this navigate or should it show an error dialog that the page was not found*/
				window.location.href = anchor.attr("href");
			}
		});
	};

	function CreateDialog(innerHtml, dialogID) {
		var titleRegex = new RegExp("<title>(.*?)</title>");
		var title = "";
		if (titleRegex.test(innerHtml)) title = titleRegex.exec(innerHtml)[1];

		var dialog = $('<div></div>').attr("id", !!!dialogID ? "dialog" + new Date().valueOf() : dialogID).html(innerHtml).appendTo('body');

		$(dialog).dialog({
			close: function (event, ui) {
				$(dialog).dialog("destroy").remove();
			},
			modal: true,
			title: title //,
			//width: "60%" //IE sucks - title bar renders improperly until dialog is resized
			//TODO: set width to width of outermost element, if missing then fallback to a %.
		});
		Nexul.Shared.AJAXDialog.Enhance($(dialog));
		Enhance($(dialog));
		$("body").trigger("dialog-ready", { dialog: $(dialog), html: innerHtml });
	};

	function Enhance(section) {
		$(section).find(":submit, .button").button();
		$(section).find(".hide").hide();
		$(section).find('.ui-state-default').hover( /*for browsers not supporting :hover CSS selector*/
			function () {
				$(this).addClass('ui-state-hover');
			}, function () {
				$(this).removeClass('ui-state-hover');
			});
		$(section).find('.autocomplete').each(function () {
			$(this).autocomplete({
				delay: ($(this).data("autocomplete-delay") || 400),
				minLength: ($(this).data("autocomplete-minlength") || 0),
				source: function (request, response) {
					$.ajax({
						url: $(this.element).data("autocomplete-url"),
						dataType: 'json',
						type: 'post',
						data: $(this.element).closest('form').first().toObject($.extend({ timestamp: +new Date() }, request)),
						success: function (data) {
							response(data);
						}
					});
				}
			}).data("autocomplete")._renderItem = function (ul, item) {
				var tName = $(this.element).data("autocomplete-itemtemplate");
				var valProp = $(this.element).data("autocomplete-itemvalue");
				if (!item.value) {
					item.value = (valProp) ? item[valProp] : ((item.Name) ? item.Name : item.name);
				}
				return $("<li></li>")
						.data("item.autocomplete", item)
						.append($("<a></a>")["html"]((tName) ? $("#" + tName).tmpl(item) : item.label))
						.appendTo(ul);
			};
		});
		$(section).find('.listbuilder').each(function () {
			$(this).listbuilder({
				duplicates: false,
				delimeter: ';',
				autocomplete: (!$(this).data("autocomplete-url")) ? false : {
					delay: ($(this).data("autocomplete-delay") || 400),
					minLength: ($(this).data("autocomplete-minlength") || 0),
					source: function (request, response) {
						$.ajax({
							url: $(this.element).data("original").data("autocomplete-url"),
							dataType: 'json',
							type: 'post',
							data: $($(this.element).data("original")).closest('form').first().toObject($.extend({ timestamp: +new Date() }, request)),
							success: function (data) {
								response(data);
							}
						});
					}
				}
			});
			if ($(this).data("listbuilder")._tokenEditor.data("autocomplete")) {
				$(this).data("listbuilder")._tokenEditor.data("autocomplete")._renderItem = function (ul, item) {
					var tName = $(this.element).data("original").data("autocomplete-itemtemplate");
					var valProp = $(this.element).data("original").data("autocomplete-itemvalue");
					if (!item.value) {
						item.value = (valProp) ? item[valProp] : ((item.Name) ? item.Name : item.name);
					}
					return $("<li></li>")
						.data("item.autocomplete", item)
						.append($("<a></a>")["html"]((tName) ? $("#" + tName).tmpl(item) : item.label))
						.appendTo(ul);
				};
			}
		});
		if (!!$.prototype.prettyDate) {
			$(section).find('.pretty-date').prettyDate();
		}
		$(section).find(".target-as-dialog:not(.ajax-submit)").bind("click", function (event) {
			event.preventDefault();
			AnchorAsDialog($(this));
		});
		Nexul.Shared.InlineEditable.Enhance(section);
		$(section).find("form.inlineSubmit").each(function () {
			$(this).find(":input").inlineSubmit({ /*turn all inputs in this form into inline submit using template defined on form element*/
				/*TODO: if these data attributes are not specified, will the widget use the defaults or will it crash? */
				savingTemplate: $(this).data("inlineSubmit-savingTemplate"),
				savedTemplate: $(this).data("inlineSubmit-savedTemplate"),
				failedTemplate: $(this).data("inlineSubmit-failedTemplate"),
				success: function (prms) { $("body").trigger("inlineSubmit-success", prms); },
				error: function (prms) { $("body").trigger("inlineSubmit-error", prms); },
				complete: function (prms) { $("body").trigger("inlineSubmit-complete", prms); },
				responseContainer: $(this).data("inlineSubmit-responseContainer")
			});
		});
		$("body").trigger("enhance", { element: section });
	};

	function RefreshSection(element, callback) {
		var refreshUrl = $(element).attr('data-view-url');
		if (!refreshUrl) { return; }
		$.ajax({
			cache: false,
			type: "get",
			url: refreshUrl,
			success: function (msg) {
				$(element).html(msg);
				Enhance(element);
				if ($.isFunction(callback)) {
					callback($(element), refreshUrl, msg);
				}
			},
			error: function (jqXHR, textStatus, errorThrown) {
				if ($.isFunction(callback)) {
					callback($(element), refreshUrl, [success = false, message = errorThrown]);
				}
			}
		});
	};

	function RefreshAllSections(callback) {
		$('[data-view-url]').each(function (index) {
			RefreshSection($(this), callback);
		});
	};
	return {
		init: init,
		Enhance: Enhance,
		AnchorAsDialog: AnchorAsDialog,
		RefreshSection: RefreshSection,
		RefreshAllSections: RefreshAllSections
	};
} ();

/*TODO: replace data('json-result-item') with data('tmplItem') data element then test.  This is what the tmpl plugin uses to store bound data item*/
/*
* editing various buttons with class 'inline-editable-button' can do specific tasks
* automatically just by specifiying some data- attributes for those desired behaviors.
*
*EX: click save - update json from form before post, post it, then show next template
*EX: click cancel - just toggle to next template
*EX: click delete - get linked json on current editable, post to url with that json attached, then show next template
*EX: click undo delete - same as delete
*EX: click add - add instance of edit template to target container
*/
Nexul.Shared.InlineEditable = function () {
	var enabled = false;
	function enable() {
		enabled = true;
	};
	function init() {
		enable();
		Enhance($(document));
	};

	function Enhance(section) {
		if (!enabled) { return; }
		if (!(section instanceof jQuery)) { section = $(section); }
		var lists = section.hasClass("inline-editable-host") ? section : section.find(".inline-editable-host");
		if (section.hasClass("inline-editable")) {
			EnhanceButtons(section); //don't want to enhance items about to be replaced
		}

		lists.each(function () {
			var list = $(this);
			var dataVar = list.data("json-var");
			var dataUrl = list.data("json-url");
			if (dataVar) {
				var data = eval(dataVar);
				if (data) {
					list.find(".inline-editable").remove();
					appendItems(list, data.Items || data.items || [data]);
				}
			} else if (dataUrl) {
				$.ajax({
					cache: false, type: "get", url: dataUrl, dataType: 'json',
					success: function (msg) {
						list.find(".inline-editable").remove();
						appendItems(list, msg.Items || msg.items || [msg]);
					},
					error: function (jqXHR, textStatus, errorThrown) {
						Nexul.Shared.AJAXForm.ResultMessage({ element: list, succes: false, message: "Server side call failed. " + errorThrown });
					}
				});
			} else {
				EnhanceButtons(list);
			}
		});
	};
	function EnhanceButtons(container) {
		if (!(container instanceof jQuery)) { container = $(container); }
		container.find(".inline-editable-button").bind("click", function (event) {
			event.preventDefault();
			clickButton(event.target);
		});
		container.find(".inline-editable-button").closest("form").submit(function () {
			return false; //buttons no longer submit, only do custom click above
		});
	};

	function appendItems(section, items) {
		var tmpln = $(section).data("template"); //default template is on list node
		$.each(items, function (index, value) {
			toggleAction({ container: section, templateName: tmpln, data: value });
		});
	};

	function toggleAction(prms) {
		var updated;
		if (prms.templateName) {
			if (prms.editable instanceof jQuery && prms.button instanceof jQuery && prms.editable.data("isNew") && prms.button.hasClass("link-button-cancel")) {
				prms.editable.remove();
				return prms;
			}
			updated = $("#" + prms.templateName).tmpl(prms.data);
		} else if (prms.html) {
			updated = $(prms.html);
		} else {
			return prms;
		}
		updated.addClass("inline-editable").data("json-result-item", prms.data);
		if (prms.editable instanceof jQuery && prms.editable.length > 0) {
			if (prms.editable.data("isNew") && prms.isUpdate) {
				updated.data("isNew", "true"); //replacing the new item on post result from url
			}
			prms.editable.before(updated).remove();
		} else {
			updated.data("isNew", "true");
			if (prms.insertOrder == "first") {
				prms.container.prepend(updated);
			} else {
				prms.container.append(updated);
			}
		}
		Nexul.Shared.jQueryUIAutoEnhance.Enhance(updated);
		prms.editable = updated;
		$("body").trigger("inline-editable-changed", prms);
		return prms;
	};

	/* An asynchronous method (usually) to do the appropriate action for a given inline-editable-button */
	function clickButton(button, callback) {
		if (!(button instanceof jQuery)) { button = $(button); }
		if (!button.hasClass("inline-editable-button")) { button = button.closest(".inline-editable-button"); } /*child element was clicked inside the button*/
		var editable = button.data("editable-element") ? $(button.data("editable-element")) : button.closest(".inline-editable") || null,
			cntr = button.data("editable-container") ? $(button.data("editable-container")) : editable.closest(".inline-editable-host"),
			json = editable == null ? null : editable.data("json-result-item") || (!!editable.data("json-var") ? eval(editable.data("json-var")) : null),
			form = button.closest("form"),
			formData = json,
			tmpln = button.data("template"),
			insertOrder = button.data("insert-order"),
			url = button.data("url"),
			urlDataType = button.data("url-datatype") || "json",
			urlMethod = button.data("url-method");
		if (form instanceof jQuery && form.length > 0) {
			if (button instanceof jQuery && !button.hasClass("link-button-cancel")) {
				if (!Nexul.Shared.validate.isValidForm(button)) { return; }
			}
			if (typeof url == 'undefined') {
				url = form.attr("action");
				urlMethod = urlMethod || form.attr("method");
			}
			json = form.toObject({json: json});
			formData = form.serialize();
		}
		var togglePrms = { container: cntr, editable: editable, button: button, form: form, templateName: tmpln, data: json, url: url, insertOrder: insertOrder };
		togglePrms = toggleAction(togglePrms);
		if (!!url) {
			if (togglePrms.templateName) {
				button.data("ajax-submit-wait-message-disable", true);
			}
			var postData = formData,
				postButtonId = button.attr('id');
			if (urlMethod == "get" && !postData) {
				postData = {};
			}
			if (postButtonId && postData) {
				if (postData.split) {
					postData = postData + "&" + postButtonId + "=" + postButtonId;
				} else {
					postData[postButtonId] = postButtonId;
				}
			}
			Nexul.Shared.AJAXForm.Post({ data: postData, type: urlMethod || "post", cache: false, url: url, dataType: urlDataType },
				function (result) {
					togglePrms.isUpdate = true;
					if (!result.split && "success" in result) { /*true or false*/
						if (result.item) {
							togglePrms.data = result.item; //item was updated altered by server
						}
						if (result.templateName) {
							togglePrms.templateName = result.templateName;
						}
						toggleAction(togglePrms);
						Nexul.Shared.AJAXForm.ResultMessage($.extend({}, result, { element: togglePrms.editable }));
					} else {
						togglePrms.html = result;
						toggleAction(togglePrms);
					}
					if ($.isFunction(callback)) {
						callback(togglePrms);
					}
				}
			);
		} else if ($.isFunction(callback)) {
			callback(togglePrms);
		}
	};

	return {
		enable: enable,
		init: init,
		Enhance: Enhance,
		EnhanceButtons: EnhanceButtons,
		Post: function () { alert("obsolete Nexul.Shared.InlineEditable.Post() function called"); },
		clickButton: clickButton
	};
} ();

(function ($) {
	if (jQuery.tmpl) {
		$.extend(jQuery.tmpl.tag, {
			"for": {
				_default: { $2: "var i=1;i<=1;i++" },
				open: 'for ($2){',
				close: '};'
			}
		});
	}
})(jQuery);

//$(document).ready(function () {
//call these in page specific scripts to turn on these features
//Nexul.Shared.AJAXDialog.enable();
//Nexul.Shared.InlineEditable.enable();
//Nexul.Shared.jQueryUIAutoEnhance.init();
//});​​