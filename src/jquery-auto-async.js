/*
* Copyright (c) 2013, Michael Lang
* Version 3.0.0.31022
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
* @authors: AUTHORS.txt
*
* jQuery Automatic Asynchronous (Github:jquery-auto-async; jquery namespace:autoasync)
* - automatically enhances elements based on data-attributes or class names
* - supports an asynchronous user interface 
* -  http://candordeveloper.com/2012/07/19/asyncui-mvc-with-progressive-enhancement/
* -  http://candordeveloper.com/2013/10/21/auto-async-with-use-cases/
*
* Depends:
*    jquery 2.0.3+
*    jquery.ui.widget.js 1.8.24+
*    jquery.ui.button.js 1.8.24+
*    jquery.validate.js 1.10.0+
*    form2js
*    jsRender beta build 40 or later

* editing various buttons with class 'inline-editable-button' can do specific tasks
* automatically just by specifying some data- attributes for those desired behaviours.
*
*EX: click save - update json from form before post, post it, then show next template
*EX: click cancel - just toggle to next template
*EX: click delete - get linked json on current editable, post to url with that json attached, then show next template
*EX: click undo delete - same as delete
*EX: click add - add instance of edit template to target container
*/

var autoasync = (function ($, window, document, undefined) {
    var attr = {};
    var callbacks = [];

    function init(callback) {
        if (callback) {
            callbacks.push(callback);
        }
        enhance($(document));
    };
    function urlRemoveParams(url, prms) {
        var hash, vars = [], u = url.split('?');
        var res = u[0], q = u[1];
        if (q != undefined) {
            q = q.split('&');
            for (var i = 0; i < q.length; i++) {
                hash = q[i].split('=');
                if (prms[hash[0]] == undefined) {
                    vars.push(q[i]);
                }
            }
            res = res + "?" + vars.join('&');
        }
        return res;
    };

    function addCallback(callback) {
        callbacks.push(callback);
    };

    function enhance(section) {
        $.each(attr, function (name, item) {
            if (($.isFunction(item.enabled) && item.enabled())
                || item.enabled == undefined || item.enabled) {
                item.enhance(section);
            }
        });
        callbacks.forEach(function (item) {
            item({ element: section });
        });
    };

    function post(eventSource, callback) {
        var ajaxParams = {},
            eventParams = {},
            waitDialog = $("#wait-dialog");
        if (eventSource instanceof $ || eventSource.split) {
            ajaxParams.source = $(eventSource);
        } else {
            $.extend(ajaxParams, eventSource);
        }
        if (ajaxParams.source) {
            var disableWaitMsg = ajaxParams.source.data("ajax-submit-wait-message-disable");
            if (!disableWaitMsg) {
                var waitMsg = ajaxParams.source.data("ajax-submit-wait-message");
                if (waitMsg == undefined) {
                    waitMsg = "Please wait...";
                }
                waitDialog = $('<div id="wait-dialog">' + waitMsg + '</div>').appendTo('body');
                $(waitDialog).dialog({ modal: true });
            }
        }

        if (!ajaxParams.url) {
            if (ajaxParams.form instanceof $) {
                ajaxParams.url = ajaxParams.form.attr("action");
            } else if (ajaxParams.source instanceof $ && ajaxParams.source.data("ajax-submit-url")) {
                ajaxParams.url = ajaxParams.source.data("ajax-submit-url");
            }
        }
        if (!ajaxParams.data) {
            if (!ajaxParams.form && ajaxParams.source instanceof $) {
                ajaxParams.form = $(ajaxParams.source).closest('form').first();
            }
            if (ajaxParams.form instanceof $) {
                var formData = ajaxParams.form.serialize();
                if (ajaxParams.source instanceof $ && ajaxParams.source.is(":button,:submit")) {
                    if (formData.length > 0 || ajaxParams.url.indexOf("?") > -1) {
                        formData += "&";
                    } else {
                        formData += "?";
                    }
                    formData += ajaxParams.source.attr("id") + "=" + ajaxParams.source.attr("id");
                    ajaxParams.form.find('#__EVENTTARGET').val(ajaxParams.source.attr("id"));
                }
                ajaxParams.data = formData;
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
                $(waitDialog).dialog("close").dialog("destroy").remove();
            },
            error: function (jqXhr, textStatus, errorThrown) {
                var msg = {
                    success: false,
                    message: (jqXhr.responseJSON || {}).Message || ("Server side call failed. " + errorThrown)
                };
                if ($.isFunction(callback)) {
                    callback(msg);
                }
                $(waitDialog).dialog("close").dialog("destroy").remove();
            }
        }, ajaxParams);
        if (ajaxParams.data && ajaxParams.url) {
            $.ajax(ajaxParams);
        } else if ($.isFunction(callback)) {
            callback({ success: false, message: "Server side connection not available at this time." });
        }
    };

    function resultMessage(prms) {
        if (!prms || !prms.element) {
            return;
        }
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

    function refreshEditable(prms) {
        var editable = $(prms.editable);
        var dataUrl = editable.data("json-url");
        if (dataUrl) {
            var data = {};
            $.each(prms.button.data(), function (key, value) {
                if (typeof value === "string") {
                    data[key] = value;
                }
            });
            dataUrl = autoasync.urlRemoveParams(dataUrl, data);
            $.ajax({
                cache: false, type: "get", url: dataUrl, dataType: 'json',
                data: data,
                success: function (msg) {
                    editable.find(".inline-editable").remove();
                    editable.find(".repeatitem").remove();
                    autoasync.appendItems(editable, msg.Items || msg.items || [].concat(msg));
                },
                error: function (jqXhr, textStatus, errorThrown) {
                    autoasync.resultMessage({ element: editable, success: false, message: "Server side call failed. " + errorThrown });
                }
            });
        }
    };

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
            el = $(el);
            if (el.is(":not(:visible)")) {
                el.val("");
            }

            if (el.val() != "" || el.hasClass('required')) {
                if (el.attr("nodeName") != "/INPUT") {
                    if (!el.parents("form").validate().element(this)) {
                        valid = false;
                    }
                }
            }
        });
        return valid;
    };

    function appendItems(section, items) {
        var tmpln = $(section).data("template"); //default template is on list node
        $.each(items, function (index, value) {
            autoasync.toggleAction({ container: section, templateName: tmpln, data: value });
        });
    };
    /*Toggles an editable element with the replacement template and enhances and refreshes the appropriate elements and container lists.*/
    function toggleAction(prms) {
        var updated;
        var edParent = prms.editable ? prms.editable.parent() : null;
        var edParentDOM = edParent ? edParent.toArray()[0] : null,
            buttonDOM = prms.button ? prms.button.toArray()[0] : null,
            buttonTargetEditableDOM = prms.container ? prms.container.toArray()[0] : null;
        var isSwap = prms.isUpdate || (!!prms.templateName
            && !!buttonDOM && !!edParentDOM && !!buttonTargetEditableDOM
            && !!$.contains(edParentDOM, buttonDOM)
            && !!$.contains(buttonTargetEditableDOM, buttonDOM));
        if (!isSwap && prms.container && $(edParent).children().length <= 1) {
            prms.container.hide();
        }   //hide container if this was the last item now disappearing.

        if (prms.templateName) {
            updated = $($("#" + prms.templateName).render(prms.data || {}));
        } else if (prms.html) {
            updated = $(prms.html);
        } else {
            prms.editable.remove();
            return prms; //nothing is replacing this item
        }
        updated.addClass("inline-editable").data("json-result-item", prms.data);

        if (prms.insertOrder == "first") {
            prms.container.prepend(updated);
        } else if (prms.insertOrder == "last") {
            prms.container.append(updated);
        } else if (isSwap) {
            //no change in position, target in same host as clicked button
            prms.editable.before(updated);
        } else {
            //fallback value: position not specified, target is different container than clicked button.
            prms.container.append(updated);
        }
        if (isSwap) {
            prms.editable.remove();
        }
        prms.container.show(); //in case hidden

        if (prms.button) {
            $(updated.data("host-selector")).each(function(i, host) {
                autoasync.refreshEditable({ editable: host, button: prms.button });
            });
        }
        autoasync.enhance(updated);
        prms.editable = updated;
        return prms;
    };

    /* An asynchronous method (usually) to do the appropriate action for a given inline-editable-button */
    function clickButton(button, callback) {
        if (!(button instanceof $)) {
            button = $(button);
        }
        if (!button.hasClass("inline-editable-button")) {
            button = button.closest(".inline-editable-button");
        } /*child element was clicked inside the button*/
        var editable = button.data("editable-element") ? $(button.data("editable-element")) : button.closest(".inline-editable") || null,
            cntr = button.data("editable-container") ? $(button.data("editable-container")) : editable.closest(".inline-editable-host"),
            json = editable == null ? null : editable.data("json-result-item") || (!!editable.data("json-var") ? eval(editable.data("json-var")) : button.data()),
            form = button.closest("form"),
            formData = json,
            tmpln = button.data("template"),
            insertOrder = button.data("insert-order"),
            url = button.data("url"),
            urlDataType = button.data("url-datatype") || "json",
            urlMethod = button.data("url-method"),
            clickCallbacks = [];
        for (var prop in json) {
            if (json[prop] instanceof $ || $.isFunction(json[prop]) || !!json[prop].eventNamespace) {
                delete json[prop]; /*remove jquery items, functions, and jquery widgets*/
            }
        }
        clickCallbacks.push(function () {
            $(button.data("host-selector")).each(function (i, host) {
                autoasync.refreshEditable({ editable: host, button: button });
            });
        });
        if (callback)
            clickCallbacks.push(callback);
        if (form instanceof $ && form.length > 0) {
            if (button instanceof $ && !button.hasClass("link-button-cancel")) {
                if (!autoasync.isValidForm(button)) {
                    return;
                }
            }
            if (typeof url == 'undefined') {
                url = form.attr("action");
                urlMethod = urlMethod || form.attr("method");
            }
            json = form.toObject({ json: json });
            formData = form.serialize();
        }
        var togglePrms = { container: cntr, editable: editable, button: button, form: form, templateName: tmpln, data: json, url: url, insertOrder: insertOrder };
        togglePrms = autoasync.toggleAction(togglePrms);
        if (!!url) {
            if (togglePrms.templateName) {
                button.data("ajax-submit-wait-message-disable", true);
            }
            urlMethod = (urlMethod || "post").toLowerCase();
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
            autoasync.post({ data: urlMethod=="post"? json : postData, type: urlMethod, cache: false, url: url, dataType: urlDataType },
                function (result) {
                    togglePrms.isUpdate = true;
                    if (!result.split && "success" in result) { /*true or false*/
                        if (result.item) {
                            togglePrms.data = result.item; //item was updated altered by server
                        }
                        if (result.templateName) {
                            togglePrms.templateName = result.templateName;
                        }
                        autoasync.toggleAction(togglePrms);
                        autoasync.resultMessage($.extend({}, result, { element: togglePrms.editable }));
                    } else {
                        togglePrms.html = result;
                        autoasync.toggleAction(togglePrms);
                    }
                    clickCallbacks.forEach(function (item) {
                        if ($.isFunction(item)) {
                            item(togglePrms);
                        }
                    });
                }
            );
        } else {
            clickCallbacks.forEach(function (item) {
                if ($.isFunction(item)) {
                    item(togglePrms);
                }
            });
        }
    };
    return {
        attr: attr,
        init: init,
        addCallback: addCallback,
        enhance: enhance,
        urlRemoveParams: urlRemoveParams,
        post: post,
        resultMessage: resultMessage,
        refreshEditable: refreshEditable,
        isValid: isValid,
        isValidForm: isValidForm,
        appendItems: appendItems,
        toggleAction: toggleAction,
        clickButton: clickButton
    };
}(jQuery, window, document));




/*TODO:  Move the following to a new file or files */


(function ($, window, document, autoasync) {
    $.extend(autoasync.attr, {
        "autocomplete": {
            enabled: true,
            enhance: function (section) {
                if (!$.fn.autocomplete && !$.autocomplete) { return; }
                $(section).find('.autocomplete').each(function () {
                    $(this).autocomplete({
                        delay: ($(this).data("autocomplete-delay") || 400),
                        minLength: ($(this).data("autocomplete-minlength") || 0),
                        source: function (request, response) {
                            $.ajax({
                                url: $(this.element).data("autocomplete-url"),
                                dataType: 'json',
                                type: ($(this.element).data("autocomplete-url-method") || 'post'),
                                data: $(this.element).closest('form').length > 0
                                    ? $(this.element).closest('form').first().toObject({ json: $.extend({ timestamp: +new Date() }, request) })
                                    : $.extend({ timestamp: +new Date() }, request),
                                success: function (data) {
                                    response(data);
                                }
                            });
                        }
                    }).data("ui-autocomplete")._renderItem = function (ul, item) {
                        var tName = $(this.element).data("autocomplete-itemtemplate");
                        var valProp = $(this.element).data("autocomplete-itemvalue");
                        if (!item.value) {
                            item.value = (valProp) ? item[valProp] : ((item.Name) ? item.Name : item.name);
                        }
                        if (!item.label) {
                            item.label = (valProp) ? item[valProp] : ((item.Name) ? item.Name : item.name);
                        }
                        return $("<li></li>")
                                .data("item.autocomplete", item)
                                .append($("<a></a>")["html"]((tName) ? $("#" + tName).render(item) : item.label))
                                .appendTo(ul);
                    };
                    if ($(this).autocomplete("option", "minLength") == 0) {
                        $(this).focus(function () {
                            $(this).data("ui-autocomplete").search($(this).val());
                        });
                    }
                });
            }
        },
        "listbuilder": {
            enabled: true,
            enhance: function (section) {
                if (!$.fn.listbuilder && !$.listbuilder) { return; }
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
                                    type: ($(this.element).data("original").data("autocomplete-url-method") || 'post'),
                                    data: ($(this.element).data("original")).closest('form').length > 0 
                                        ? $($(this.element).data("original")).closest('form').first().toObject({ json: $.extend({ timestamp: +new Date() }, request) })
                                        : $.extend({ timestamp: +new Date() }, request),
                                    success: function (data) {
                                        response(data);
                                    }
                                });
                            }
                        }
                    });
                    if ($(this).data("ui-listbuilder")._tokenEditor.data("ui-autocomplete")) {
                        $(this).data("ui-listbuilder")._tokenEditor.data("ui-autocomplete")._renderItem = function (ul, item) {
                            var tName = $(this.element).data("original").data("autocomplete-itemtemplate");
                            var valProp = $(this.element).data("original").data("autocomplete-itemvalue");
                            if (!item.value) {
                                item.value = (valProp) ? item[valProp] : ((item.Name) ? item.Name : item.name);
                            }
                            if (!item.label) {
                                item.label = (valProp) ? item[valProp] : ((item.Name) ? item.Name : item.name);
                            }
                            return $("<li></li>")
                                .data("item.autocomplete", item)
                                .append($("<a></a>")["html"]((tName) ? $("#" + tName).render(item) : item.label))
                                .appendTo(ul);
                        };
                    }
                });
            }
        },
        "datepicker": {
            enabled: true,
            enhance: function (section) {
                if (!$.prototype.datepicker) { return; }
                $(section).find('.datepicker').datepicker();
            }
        },
        "pretty-date": {
            enabled: true,
            enhance: function (section) {
                if (!$.prototype.prettyDate) { return; }
                $(section).find('.pretty-date').prettyDate();
            }
        },
        "inline-submit": {
            enabled: true,
            enhance: function (section) {
                if (!$.fn.inlineSubmit && !$.inlineSubmit) { return; }
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
            }
        },
        "button": {
            enabled: true,
            enhance: function (section) {
                if (!$.fn.button) { return; }
                $(section).find(":submit, .button").button();
            }
        },
        "hide": {
            enhance: function (section) {
                $(section).find(".hide").hide();
            }
        },
        "hover": {
            enhance: function (section) {
                $(section).find('.ui-state-default').hover( /*for browsers not supporting :hover CSS selector*/
                    function () {
                        $(this).addClass('ui-state-hover');
                    }, function () {
                        $(this).removeClass('ui-state-hover');
                    });
            }
        },
        "datarepeater": {
            enabled: true,
            enhance: function (section) {
                $(section).find(".datarepeater").each(function () {
                    var list = $(this);
                    var dataUrl = list.data("json-url");
                    var templateName = list.data("template");
                    if (!dataUrl) { return; }
                    $.ajax({
                        cache: false, type: "get", url: dataUrl, dataType: 'json',
                        success: function (msg) {
                            var data = (msg.Items || msg.items || [].concat(msg));
                            list.find(".repeatitem").remove();
                            if (templateName) {
                                $.each(data, function (index, item) {
                                    var gen = $($("#" + templateName).render(item));
                                    gen.addClass("repeatitem").data("json-result-item", item);
                                    list.append(gen);
                                });
                            } else {
                                list.append(data);
                            }
                        },
                        error: function (jqXhr, textStatus, errorThrown) {
                            autoasync.resultMessage({ element: list, succes: false, message: "Server side call failed. " + errorThrown });
                        }
                    });
                });
            }
        },
        "inline-editable": {
            enabled: true,
            enhance: function (section) {
                if (!(section instanceof $)) { section = $(section); }
                var lists = section.hasClass("inline-editable-host") ? section : section.find(".inline-editable-host");
                lists.each(function () {
                    var list = $(this);
                    var dataVar = list.data("json-var");
                    var dataUrl = list.data("json-url");
                    if (dataVar) {
                        var data = eval(dataVar);
                        if (data) {
                            list.find(".inline-editable").remove();
                            autoasync.appendItems(list, data.Items || data.items || [].concat(data));
                        }
                    } else if (dataUrl) {
                        $.ajax({
                            cache: false, type: "get", url: dataUrl, dataType: 'json',
                            success: function (msg) {
                                list.find(".inline-editable").remove();
                                autoasync.appendItems(list, msg.Items || msg.items || [].concat(msg));
                            },
                            error: function (jqXhr, textStatus, errorThrown) {
                                autoasync.resultMessage({ element: list, succes: false, message: "Server side call failed. " + errorThrown });
                            }
                        });
                    }
                });
            }
        },
        "inline-editable-button": {
            enabled: true,
            enhance: function (section) {
                if (!(section instanceof $)) { section = $(section); }

                section.find(".inline-editable-button").each(function (i, btn) {
                    if (!(btn instanceof $)) { btn = $(btn); }
                    var cntr = btn.data("editable-container") ? $(btn.data("editable-container")) : btn.closest(".inline-editable-host");
                    if (cntr == undefined || cntr.length == 0) {
                        return;
                    }
                    btn.bind("click", function (event) {
                        event.preventDefault();
                        autoasync.clickButton(event.target);
                    });
                    btn.closest("form").submit(function () {
                        return false; //buttons no longer submit, only do custom click above
                    });
                });
            }
        },
        "inline-editable-host-updater": {
            enabled: true,
            enhance: function (section) {
                $(section).find(".inline-editable-host-updater").not(":submit").click(function (event) {
                    var updater = $(this);
                    $(updater.data("host-selector")).each(function (i, host) {
                        autoasync.refreshEditable({ editable: host, button: updater });
                    });
                });
            }
        },
        "template-dialog": {
            enabled: true,
            enhance: function (section) {
                if (!(section instanceof $)) { section = $(section); }

                section.find(".template-dialog").each(function (i, btn) {
                    $(btn).unbind("click").click(function (event) {
                        var link = $(this);
                        var templateName = link.data("template");
                        if (!templateName) {
                            return;
                        }
                        event.preventDefault();
                        var host = $(link.data("appendTo") || "body");
                        var data = link.data();
                        var content = $($("#" + templateName).render(data));
                        var dialogId = content.attr("id") || "dialog" + new Date().valueOf();
                        content.attr("id", dialogId);
                        $(content).dialog({
                            appendTo: host,
                            width: "auto",
                            close: function () {
                                $(dialogId).dialog("destroy").remove();
                            }
                        });
                        //TODO: button clicks inside with class 'close-dialog' should close the dialog
                        autoasync.enhance($(content));
                    });
                });
            }
        }
    });
}(jQuery, window, document, autoasync || {}));