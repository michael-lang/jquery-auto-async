Usage
-----

Do this anywhere you want to enable autoasync behavior on a page.
	
    (function ($) {
        $(function() { /*The DOM ready event*/
            $.autoasync.init();
        });
    })(jQuery);

Alternatively you may want to enable autoasync on a page within a module pattern encapsulating all logic for your page such as the following.

    var CompanyName = CompanyName || {};
    CompanyName.PageName = function () {
        function init() {
            jQuery.autoasync.init();
            /*this event handler binds to an event raised by autoasync for custom enhancements to a block of page html.*/
            $("body").bind("enhance", function (event, prms) {
                _enhance(prms.element);
            });
        };
		/*This is a locally scoped private function.*/
        function _enhance(section) {
            $(section).find("textarea.rich-editor").wmd();
            $(section).find(".resizable").resizable({ handles: 'e,s,se', autoHide: true, preserveCursor: true });
        };
		/*return the public scope accessible functions.*/
        return {
            init: init
        };
    } (); //end of the module definition
	
    (function ($) {
        $(function() { /*The DOM ready event*/
		    //initialize your custom page module script.
            CompanyName.PageName.init();
        });
    })(jQuery);
	
Contents of autoasync 
---------------------

This is the legacy API doc.  It needs to be updated with new names for functions.

jQuery.tmpl extension method: 'for', no dependencies

Modules:
validate
	validate.isValid
	validate.isValidForm
	depends on: jquery validate
	
AJAXForm
	AJAXForm.ResultMessage
	AJAXForm.Post

AJAXDialog
	AJAXDialog.enable
	AJAXDialog.init
	AJAXDialog.Enhance
	AJAXDialog.ForceEnhance
	AJAXDialog.Post
	depends on: AJAXForm.Post, jQueryUIAutoEnhance.CreateDialog

InlineEditable
	InlineEditable.enable
	InlineEditable.init
	InlineEditable.Enhance
	InlineEditable.EnhanceButtons
	InlineEditable.Post
	InlineEditable.clickButton
	depends on: AJAXForm.ResultMessage, jQueryUIAutoEnhance.Enhance, validate

jQueryUIAutoEnhance
	jQueryUIAutoEnhance.init
	jQueryUIAutoEnhance.AnchorAsDialog
	jQueryUIAutoEnhance.CreateDialog
	jQueryUIAutoEnhance.Enhance
	jQueryUIAutoEnhance.RefreshSection
	jQueryUIAutoEnhance.RefreshAllSections
	depends on: AJAXDialog.Enhance, InlineEditable.Enhance, 
		jquery-inlineSubmit, jquery-ui-autocomplete, jquery-ui-listbuilder, prettyDate