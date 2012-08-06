Usage
-----

Do this anywhere you want to enable autoasync behavior on a page.
	
    jQuery(document).ready(function() { /*The DOM ready event*/
        $.autoasync.init();
    });

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
	
    jQuery(document).ready(function() { /*The DOM ready event*/
        //initialize your custom page module script.
        CompanyName.PageName.init();
    });
	
Contents of autoasync 
---------------------

This is the legacy API doc.  It needs to be updated with new names for functions.

jQuery.tmpl extension method: 'for', no dependencies

$.autoasync.init
================
call this one time to enhance the document.  This should only be fired one time per page.

$.autoasync.enhance
===================
call this on any jquery selector or DOM element to enhnace it and all child elements.  You
can call this any many times as needed after the initial page load.  This is called internally
by any other methods that dynamically load DOM from ajax calls or instantiation of templates.

$.autoasync.post
================
Posts an element via ajax using attributes on the element to control the $.ajax options.
Alternatively pass in a json object with the options.
 - TODO: document the json options not part of $.ajax

$.autoasync.resultMessage
=========================
Updates an element with class "msg" applied with the resulting error or success message from an ajax post as
returned by the server.

$.autoasync.postDialog
======================
Posts the contents of a dialog and decides if the dialog should remain open based on success of the ajax call.
This is meant to be used by dialogs opened by createDialog.

$.autoasync.createDialog
========================
creates a dialog from an html string and enhances it.

$.autoasync.refreshSection
==========================
Refreshes a section of html with data from a given url specified by attribute "data-view-url".  Does nothing
if the attribute is missing or not a valid url.

$.autoasync.refreshAllSections
==============================
Refreshes all sections of html on the page that have the "data-view-url" attribute.

$.autoasync.isValid
===================
Checks if a given element is valid per the validate plugin, if it is registered and if a rule is attached to the element.

$.autoasync.isValidForm
=======================
Checks if a form containing an element is valid per the validate plugin.  If the validate plugin in not registered or not applicable to the form then it returns true.

$.autoasync.appendItems
=======================
Internal method.  Needs rename?

$.autoasync.toggleAction
========================
Internal method to toggle to another view for an asyncUI section of DOM (class 'inline-editable').

$.autoasync.clickButton
=======================
Internal method to handle the click of an asyncUI button (class 'inline-editable-button').

$.autoasync.attr
================
An array that can be extended with additional enhancements to be done when DOM is loaded via ajax or injected as part of a template instantiation.

Each array item can have an 'enabled' property that is a boolean or a function to determine if it should be executed.

Each array item must have an 'enhance' function taking a single parameter for the html section to enhance.

Built in enhancements
---------------------
Documentation coming soon...

 - autocomplete
 - listbuilder
 - pretty-date
 - inline-submit
 - button
 - hide
 - hover
 - anchordialogopener
 - anchordialogpost
 - inlineeditable
 - inlineeditablebuttons