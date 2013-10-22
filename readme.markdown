Usage
=====

Do this anywhere you want to enable autoasync behavior on a page.
	
    jQuery(document).ready(function() { /*The DOM ready event*/
        $.autoasync.init();
    });

Alternatively you may want to enable autoasync on a page within a module pattern encapsulating all logic for your page such as the following.

    (function ($, window, document, autoasync) {
        var CompanyName = CompanyName || {};
        CompanyName.PageName = function () {
            function init() {
                autoasync.init(function (prms) {
                    _enhance(prms.element);
                });
            };
    		/*This is a locally scoped private function to do custom enhancements as page templates are instantiated.*/
            function _enhance(section) {
                $(section).find("textarea.rich-editor").wmd();
                $(section).find(".resizable").resizable({ handles: 'e,s,se', autoHide: true, preserveCursor: true });
            };
    		/*return the public scope accessible functions.*/
            return {
                init: init
            };
        }(); //end of the module definition
        $(document).ready(function () {
            CompanyName.PageName.init();
        });
    }(jQuery, window, document, autoasync || {}));

What can it do?
=================

Use Case 1: Working a list of items
-----------------------------------

This use case covers when you are working a list of items and need to toggle over to alternate views for that item on demand.  Buttons inside an element that swaps out the entire container element with another template using the same data.  Each data item goes in the same element that acts as a list container.  The type of html elements used for the list and for the items can be anything.  The behaviour is controlled by data- attributes on the elements and the elements of each role require a specific class decorator.  You can use this to have a read-only, edit, un-deletable version of an element.  Or you can use it to have a different template for each status of a data element.  Maybe one view for pending, another for working, another for completed.

Basic Structure of the page:

    <div class="worklist-items inline-editable-host"
    	data-template="WorkRequestView"
    	data-json-url="/Worklist/ByDay?date=20131021">
    </div>

The auto-async script looks for container elements with class "inline-editable-host" and enhances behavior of those elements using options specified on data- attributes.

- data-json-url: A url to load a list of items from.  The returned data structure must either have a property called "Items" or "items", or the JSON structure must be an array.
- data-json-var: Optional, defines the same data as data-json-url so an extra server hit is not required for the initial page load.  This can supplement or replace the data-json-url attribute.
- data-template: The template to instantiate for each JSON array item. The example above uses a template called 'WorkRequestView', which must be defined on the page in a template script block.  

The following two templates are part of a view/edit pair.

Basic structure of a status template (read-only):

    <script id="WorkRequestView" type="text/x-jsrender">
		<div class="inline-editable" id="Request{{>ConfirmationNumber}}">
			<div>
				<!-- TODO: display any desired properties as read-only or editable here -->
				<span class="input-row">
					<span class="confirmation-label">Confirmation Number:</span>
					<span class="confirmation">{{>ConfirmationNumber}} </span>
				</span>
				<!-- TODO: display any desired properties as read-only or editable here -->
				<div class="command-buttons">
					<input type="submit" value="Edit" id="EditAction" name="EditAction" 
						class="inline-editable-button float-left"
						data-template="WorkEditAction" 
						data-url="" />
					<span class="msg clear"></span>
					<br class="clear-fix" />
				</div>
			</div>
		</div>
    </script>
	
Basic structure of an action template (edit form):

    <script id="WorkEditAction" type="text/x-jsrender">
        <div class="inline-editable">
    		<form action="/Worklist/ByDay?date=20131021" method="post">
                <input type="hidden" name="ConfirmationNumber" id="ConfirmationNumber" value="{{>ConfirmationNumber}}" />
                <span class="input">
                    <label for="Comment">Comment</label>
                    <input id="Comment" name="Comment" value="" type="text">
                </span>
                <div class="command-buttons">
                    <input type="submit" value="Approve" id="Approve" name="Approve" class="inline-editable-button left-float"
                        data-template="WorkRequestView" />
                    <input type="submit" value="Cancel" id="Cancel" name="Cancel" class="inline-editable-button right-float"
                        data-template="WorkRequestView" data-url="" />
                    <span class="msg clear"></span>
                    <br class="clear-fix" />
                </div>
    		</form>
        </div>
    </script>

Note the template syntax for inserting data item property values into the generated html.  Each button that can toggle over to another view must have the "inline-editable-button" class applied.  data- attributes contol the behavior of the buttons.

- data-url: defines where to post the form containing this button to, which you use to tell the server about the change in state and persist anything the user did on this view.  If this attribute is missing, then it will use the parent form action url.  If there is no form, and no data-url attribute, then no post occurs and it just swaps to the next view.
- data-template: The name of the template to be switched over to when the button is clicked.  The same item the current view was bound to will also be bound to the new view.  

Once the post to data-url is complete, the defined data-template will be bound again to the JSON item returned from the server.  This accounts for the server updating a calculated property, or just checking if it was updated by another user.

Note how 'cancel' is implemented to not send any data to the server and just toggle back over to the read-only view.  It does this by setting data-url to an empty value to override the form action url.

Use Case 2: Filter a list of editable items from a list of links:
-----------------------------------------------------------------
This use case covers when you have a very large list of items to be modified in use case 1, but you want that list filtered by some other criteria on the page, such as a link for each date or each category, or whatever other generic filters you have.  You start by defining your list of items and their various status templates per use case 1.  Then you can layer this use case on top by defining a list of filters.

Container Element: A list of top level filters:

    <div class="worklist-months inline-editable-host" 
    	data-json-url="/Worklist/MonthSummaryByRange?date=20131001&amp;pastMonths=4&amp;totalMonths=9" 
    	data-template="WorklistMonthPagerItem">
    </div>

This references a template called 'WorklistMonthPagerItem' which should be defined on the page in a template script block.  auto-async will load the data-json-url and use the returned json format data to instantiate the data-template and put an instance in the inline-editable-host for each result item. The JSON data can either be returned as an object with an Items property, items property, or the result can be a JSON list.  So far this is the same as in use case 1.

Basic structure of the worklist month pager item:

    <script id="WorklistMonthPagerItem" type="text/x-jsrender">
        <span class="worklist-month {{>UrgencyStyle}}">
            <span class="inline-editable-host-updater worklist-month-pager {{>RelativeMonthStyle}}" 
                  data-host-selector="#worklist-date-title, .worklist-items, .worklist-days, .worklist-months" 
                  data-date="{{>RequestYear}}/{{>RequestMonth}}/01" 
                  title="{{>OpenRequests}} Open Requests, {{>ExpiringRequests}} Expiring Requests">
                {{>MonthName}} 
            </span>
        </span>
    </script>

Notice the jsRender syntax to put JSON data item properties into the template instance.  The only class that must be on elements here is the "inline-editable-host-updater", the rest are for style of this example.  The element with the "inline-editable-host-updater" can control what the autoasync does with data attributes.

- data-host-selector: A jQuery selector(s) of the elements to be reloaded when this item is clicked.
- data-?: any number of other attribute values to be passed onto the items being updated when loading data.  See example below.

An example of an updated item:

    <div class="worklist-days inline-editable-host" 
		data-json-url="/Worklist/SummaryByRange?date=20131001" 
		data-template="WorklistSummaryByDayMini">
    </div>

The above item has a class of "worklist-days" which is one of the selectors in the worklist month pager example above, in attribute 'data-host-selector'.   When auto-async refreshes an "inline-editable-host", it does so by running the same logic that occurs when the section is initialized after page load.  See use case 1 for the logic again.  This refers to yet another template on the page for showing a day of the month.

    <script id="WorklistSummaryByDayMini" type="text/x-jsrender">
    	<span class="worklist-day {{>UrgencyStyle}}">
    		<span class="inline-editable-host-updater worklist-day-number {{>RelativeDayStyle}}" 
    			data-host-selector=".worklist-items" 
    			data-date="{{>~formatDateNumeric(RequestDate)}}"
    			title="{{>OpenRequests}} Open Requests, {{>ExpiringRequests}} Expiring Requests">
    			{{>RequestDay}}
    		</span>
    	</span>
    </script>
	
As you can see this is yet another filter that when a date is clicked will again filter the main list of items from use case 1.  The data-date in this template and in the month list above both are parameter values passed to the data-json-url of the parent 'inline-editable-host' container element.  The server side code looks for the date parameter to know what values to return in the list.  For instance the date parameter tells the /Worklist/SummaryByRange API call what month to return days of the month for.  You may see a conflict in that the date parameter is already specified on the data-json-url path querystring.  auto-async handles this by removing prior values in the querystring of the same name as any data attribute values being passed.  Basically the data- extra parameter values are overrides for the default url parameters.

Use case 3: data repeaters (example: radio button list):
---------------------------
There is another special element type enhanced by auto-async, similar to inline-editable-host.  However, the 'datarepeater' behaves slightly different.  It does not have any buttons inside it to toggle a given view item.  The repeater is meant primarily for the use case of a radio button list.  These are generally used inside of a inline-editable template.

Basic structure of a data repeater:

	<span class="datarepeater"
        data-json-url="/Worklist/NextStatusTypes?date=20131021&confirmationNumber={{>ConfirmationNumber}}"
        data-template="NextStatusRadioList">
	</span>

This is as simple as it gets.  Generally this is used to add a list of inputs to a form.  It supports these attributes.

- data-json-url: A url to load a list of items from.  The returned data structure must either have a property called "Items" or "items", or the JSON structure must be an array.
- data-template: The template to instantiate for each JSON array item. The example above uses a template called 'NextStatusRadioList', which must be defined on the page in a template script block. 

Example called by the above repeater:

    <script id="NextStatusRadioList" type="text/x-jsrender">
        <input type="radio" name="NextStatusId" value="{{>NextStatusId}}" {{if IsSelected}}checked{{/if}} />
        <span class="name">{{>Name}}</span>
        <span class="desc">Desc: {{>Description}}</span><br/>
    </script>


Built in enhancements (plug-ins)
=====================

autocomplete
------------
This will enhance any textbox into an jQuery UI autocomplete textbox.  The jQuery plugin and any dependencies must be loaded into the page.

To enable on a textbox, add class "autocomplete" to the textbox.

Supported data- attributes:

- data-autocomplete-delay: Sets the delay parameter of the autocomplete box.  Default is 400.
- data-utocomplete-minlength: Sets the minimum length before autocomplete suggestions will appear.  Default is 0 (none).
- data-autocomplete-url (required): The url to load the autocomplete items from.  A post is used to get the data.
- data-autocomplete-itemtemplate: The jsRender template name used to render each item.  If none specified, the "value" of the JSON item is used.
- data-autocomplete-itemvalue: The property name on JSON data elements that is considered the 'value' after a selection is made.  Defaults to "Name" or "name" (whichever exists).

listbuilder
-----------
This will enhance any textbox into a jQuery UI listbuilder textbox.  This is not part of core jQuery UI yet.  The jQuery plugin, listbuilder widget, and any dependencies must be loaded into the page for this to work.  listbuilder is an extension of jQuery UI autocomplete.  The difference is autocomplete allows selection of multiple values, and edit of those values.

To enable on a textbox, add class "listbuilder" to the textbox.

Supported data- attributes (same as autocomplete):

- data-autocomplete-delay: Sets the delay parameter of the autocomplete box.  Default is 400.
- data-utocomplete-minlength: Sets the minimum length before autocomplete suggestions will appear.  Default is 0 (none).
- data-autocomplete-url (required): The url to load the autocomplete items from.  A post is used to get the data.
- data-autocomplete-itemtemplate: The jsRender template name used to render each item.  If none specified, the "value" of the JSON item is used.
- data-autocomplete-itemvalue: The property name on JSON data elements that is considered the 'value' after a selection is made.  Defaults to "Name" or "name" (whichever exists).

pretty-date
-----------
Turns any span, div, or other element UTC date to a relative date display.  This requires the pretty-date widget to be on the page along with any dependencies.  There are no options.

inline-submit
-------------
TODO: this item may be removed from auto-async given the improved inline-editable enhancements?  Or it may be rewritten?

button
------
Turns any supported element (link, button) into a jQuery UI button.  The jQuery UI button and any dependencies must be included on the page.

This will enhance any supported element of type submit, or that has a class of "button" applied.

hide
----
Any element with the "hide" class will be hidden on page load.  This only requires jQuery to be included on the page.

hover
-----
This makes up for any browser that does not support the :hover CSS selector by applying the jQuery UI hover styles on hover events using javascript code.  Any element with style "ui-state-default" will get style "ui-state-hover" applied on hover, and have "ui-state-hover" removed when the item is not hovered over.

anchordialogopener
------------------
TODO: this item may be removed from auto-async given the improved inline-editable enhancements?

anchordialogpost
----------------
TODO: this item may be removed from auto-async given the improved inline-editable enhancements?

inlineeditable
--------------
See the documentation use cases above for how this works in detail.  Any element with class "inline-editable-host" applied will become an auto-async inline editable host per the use cases above.

inlineeditablebuttons
---------------------
See the documentation use cases above for how this works in detail.  Any element with class "inline-editable-button" applied that has a data-editable-container attribute pointing to a valid selector, or that is within an element with class "inline-editable-host" will trigger the auto-async button functionality described in the use cases above; also form posts for these buttons will be prevented since they will instead be AJAX posts.
 
datarepeater
------------
See the documentation use cases above for how this works in detail.  Any element with class "datarepeater" applied will become an auto-async data repeater.

 
Built in functions
=====================

You probably don't need to call any of the built in functions, unless you are adding a new plug-in to auto-async.  These functions are public so they can be used by the various plug-ins defined above.  They make all the above use cases work.  At this time, the functions available here and the details on how they work are still evolving.  Some may be deprecated or restructured in the future.

$.autoasync.init
----------------
call this one time to enhance the document.  This should only be fired one time per page.

$.autoasync.enhance
-------------------
call this on any jquery selector or DOM element to enhnace it and all child elements.  You
can call this any many times as needed after the initial page load.  This is called internally
by any other methods that dynamically load DOM from ajax calls or instantiation of templates.

$.autoasync.post
----------------
Posts an element via ajax using attributes on the element to control the $.ajax options.
Alternatively pass in a json object with the options.
 - TODO: document the json options not part of $.ajax

$.autoasync.resultMessage
-------------------------
Updates an element with class "msg" applied with the resulting error or success message from an ajax post as
returned by the server.

$.autoasync.postDialog
----------------------
Posts the contents of a dialog and decides if the dialog should remain open based on success of the ajax call.
This is meant to be used by dialogs opened by createDialog.

$.autoasync.createDialog
------------------------
creates a dialog from an html string and enhances it.

$.autoasync.refreshSection
--------------------------
Refreshes a section of html with data from a given url specified by attribute "data-view-url".  Does nothing
if the attribute is missing or not a valid url.

$.autoasync.refreshAllSections
------------------------------
Refreshes all sections of html on the page that have the "data-view-url" attribute.

$.autoasync.isValid
-------------------
Checks if a given element is valid per the validate plugin, if it is registered and if a rule is attached to the element.

$.autoasync.isValidForm
-----------------------
Checks if a form containing an element is valid per the validate plugin.  If the validate plugin in not registered or not applicable to the form then it returns true.

$.autoasync.appendItems
-----------------------
Internal method.  Needs rename?

$.autoasync.toggleAction
------------------------
Internal method to toggle to another view for an asyncUI section of DOM (class 'inline-editable').

$.autoasync.clickButton
-----------------------
Internal method to handle the click of an asyncUI button (class 'inline-editable-button').

$.autoasync.attr
----------------
An array that can be extended with additional enhancements to be done when DOM is loaded via ajax or injected as part of a template instantiation.

Each array item can have an 'enabled' property that is a boolean or a function to determine if it should be executed.

Each array item must have an 'enhance' function taking a single parameter for the html section to enhance.


Other resources:
===============
http://stackoverflow.com/questions/1898402/jquery-plugin-extend
http://addyosmani.com/resources/essentialjsdesignpatterns/book/#jquerypluginpatterns

Examples / Articles:
--------------------
http://candordeveloper.com/2012/07/19/asyncui-mvc-with-progressive-enhancement/