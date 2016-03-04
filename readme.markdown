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

Note the template syntax for inserting data item property values into the generated html.  Each button that can toggle over to another view must have the "inline-editable-button" class applied.  data- attributes control the behaviour of the buttons.

- data-url: defines where to post the form containing this button to, which you use to tell the server about the change in state and persist anything the user did on this view.  If this attribute is missing, then it will use the parent form action url.  If there is no form, and no data-url attribute, then no post occurs and it just swaps to the next view.
- data-template: The name of the template to be switched over to when the button is clicked.  The same item the current view was bound to will also be bound to the new view. 
- data-editable-container: Optional, defines a container elsewhere in document where the template should be inserted.  This is intended for things like an 'add' button to the list.  If not specified, the target container is the closest parent with class 'inline-editable-host'.  See use case 4 for example usage.
- data-editable-element: Optional, A selector to an inline-editable element.  It is for edge cases when the button does not exist within the element being toggled to another state.  When not specified, the closest parent element with class 'inline-editable' is used.
- data-insert-order: Optional, when specified as 'first' it sets if the replacement view template as the first inline editable within the target container inline editable host.  Any other value, or when missing puts the replacement template in the same order as the view being replaced, or if an insert/add it goes at the end by default.
- data-url-method: Optional. If specified it determines the http transport method to call the data-url.  'get' by default.

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

Use case 4: open link in a dialog:
----------------------------------

You may want to open a detailed window in a dialog.  Starting in version 3.0, this is as easy as putting a class of 'template-dialog' on a clickable element (anything that fires a click event).  When the element is clicked on, it will open a template as a jQuery UI dialog.

Options:
- data-template: The template to be instantiated into the dialog.
- data-appendTo: Optional. The parent element to append the instantiated template before it is turned into a dialog.  The default is 'body'.
- data-?: You can add as many arguments as desired and they are all passed into the template when instantiated (minus the 'data-' prefix).  If there are dashes in the data- attributes, they are removed and the next character is upper cased.  Example: 'data-confirmation-number' becomes 'confirmationNumber', and 'data-host-selector' becomes 'hostSelector' in the instantiated template.

Note, this does not load a url as part of instantiating the dialog.  However, if you want the dialog populated from data loaded from your server API, just put an inline-editable-host per use case 1 in the template instantiated into the dialog.  It will enhance itself and work as expected in use case 1.

Example markup containing a "template-dialog" link (this appears inline on the page):

    <script id="RequestCommentPartialListView" type="text/x-jsrender">
		<div class="worklist-partial-comments" id="Comments{{>ConfirmationNumber}}">
			<span class="datarepeater worklist-comment-partial-repeater"
				data-json-url="/worklist/RequestActivity?confirmationNumber={{>ConfirmationNumber}}"
				data-template="RequestCommentPartialView"></span>
			<div class="full-comments-link">
				<a href="#" class="template-dialog"
					data-template="RequestCommentListView"
					data-host-selector="#Comments{{>ConfirmationNumber}} .worklist-comment-partial-repeater"
					data-confirmation-number="{{>ConfirmationNumber}}">View All Customer Comments</a>
			</div>
		</div>
	</script>

Notice how this sample also has a data-host-selector attribute.  This does not actually update any other elements when this link is clicked, because it does not have the "inline-editable-host-updater" class applied.  The reason it is there is to pass it down to the next template.  Notice how {{>hostSelector}} is used in this next instantiated template.  The child template does not know what other parent elements need to be updated, so the parent template just needs to pass it along.

    <script id="RequestCommentListView" type="text/x-jsrender">
        <div class="worklist-comments worklist-comment-repeater" id="Comments{{>confirmationNumber}}">
            <span class="inline-editable-host worklist-comment-repeater"
              data-json-url="/worklist/RequestActivity?confirmationNumber={{>confirmationNumber}}"
              data-template="RequestCommentView"></span>
            <div class="worklist-comment-add">
                <h3>Add Comment</h3>
                <div class="add-comment-box">
					<form action="/worklist/RequestComment" method="post">
						<input type="hidden" name="confirmationNumber" id="confirmationNumber" value="{{>confirmationNumber}}" />
                        <span class="input">
                            <textarea id="comment" name="comment" class="resizable"></textarea>
                        </span>
                        <div class="command-buttons">
                            <input type="submit" value="Save" id="Save" name="Save" class="inline-editable-button right-float inline-editable-host-updater"
                                   data-host-selector="#Comments{{>confirmationNumber}} .worklist-comment-repeater, {{>hostSelector}}"
                                   data-editable-container="#Comments{{>confirmationNumber}} .worklist-comment-repeater" />
                            <span class="msg clear"></span>
                        </div>
					</form>
				</div>
            </div>
        </div>
    </script>

Here are the item templates used by each comment list.  The partial view shows minimal data that fits in a smaller space.  The full comment item includes all the available fields.  These are included just to show why you may want to implement this use case.

    <script id="RequestCommentPartialView" type="text/x-jsrender" data-jsv-tmpl="_9">
        <span class="waitlist-request-comment">
            <span class="comment-date">{{>~formatDate(Date)}}</span>
            <span class="comment-name">{{>Name}}</span>
            <span class="comment-text">{{>Comment}}</span>
        </span>
    </script>
    <script id="RequestCommentView" type="text/x-jsrender" data-jsv-tmpl="_16">
        <span class="waitlist-request-comment">
            <span class="comment-date">{{>~formatDate(Date)}}</span>
            <span class="comment-name">{{>Name}}</span>
            <span class="comment-status">{{>StatusChange}}</span>
            <span class="comment-text">{{>Comment}}</span>
        </span>
    </script>
	
Use Case 5: Conditional header add button for a list:
----------------------------------
This use case covers if you want to have a header of information above an editable list that changes based on the number of items in the list.
Take for example a software as a service that charges based on the number of users paid on your account.  You buy user credits and then you
can add users up to the amount of credits you have purchased.  In this sample, a button to add a member is shown above the list, and when no credits
are left, a notice and link to buy more credits is shown at the bottom of the list.

MVC Razor view partial:

			<div class="row inline-editable-header member-header" data-template="MemberHeader"
                 data-editable-host=".member-list">
                <div class="col-md-12">
                </div>
            </div>
			
            <div class="row inline-editable-host member-list"
                 data-template="MemberListItem"
                 data-template-noitems="MemberListItemNone"
                 data-json-url="/api/family/members/@Model.Family.FamilyId"
                 data-editable-header=".member-header, .member-footer">
                <div class="col-md-12 inline-editable">
                    <div class="note note-info">
                        <i class="fa fa-spinner fa-spin"></i>
                        Loading Members...
                    </div>
                </div>
            </div>
			
            <div class="row inline-editable-header member-footer" data-template="MemberFooter"
                 data-editable-host=".member-list">
                <div class="col-md-12">
                </div>
            </div>

View templates referenced by the cshml Razor view:

This first template inserts at page load a value of the number of paid user credits, with @(Model.Family.PaidUserCount)
Each time the button is pressed an Add template is added at the start of the list (with data-insert-order="first"), then
this header (and footer) is updated; A 'count' property is included in the model bound to these templates to determine
if the button is still displayed.  Each time the button text is updated with the number of users that can still be added.

    <script id="MemberHeader" type="text/x-jQuery-tmpl">
        <div class="col-md-12">
            {{if count < @(Model.Family.PaidUserCount)}}
            <a href="#" class="btn btn-info inline-editable-button"
               data-template="MemberAdd" data-insert-order="first"
               data-editable-container=".member-list">Add Member ({{:@(Model.Family.PaidUserCount)-count}} left)</a>
            {{/if}}
        </div>
    </script>

The following footer to the list will show a message if no credits remain, with a link to buy more credits.
	
    <script id="MemberFooter" type="text/x-jQuery-tmpl">
        <div class="col-md-12">
            {{if count >= @(Model.Family.PaidUserCount)}}
            <div class="note note-warning">
                <p>
                    You have reached your plan member limit of @(Model.Family.PaidUserCount).  
                    You can add more members buy purchasing member credits.
                </p>
                <p>
                    <a href="@Url.Action(MVC.AccountPersonal.ProvisionFamilyMembers(Request.RawUrl, 1))"
                       class="btn btn-info">Purchase Credits Now</a>
                </p>
            </div>
            {{/if}}
        </div>
    </script>
	
If after the user presses Add, they press 'Cancel' on the add member view the header and footer are updated again with one less
in the count since the list will have removed that add template without added a new member.
	
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

inlineeditable
--------------
See the documentation use cases above for how this works in detail.  Any element with class "inline-editable-host" applied will become an auto-async inline editable host per the use cases above.

inlineeditablebuttons
---------------------
See the documentation use cases above for how this works in detail.  Any element with class "inline-editable-button" applied that has a data-editable-container attribute pointing to a valid selector, or that is within an element with class "inline-editable-host" will trigger the auto-async button functionality described in the use cases above; also form posts for these buttons will be prevented since they will instead be AJAX posts.
 
inline-editable-header
---------------------
See the documentation use cases above for how this works in detail.  
A header, footer, or any page area that displays some information or context sensitive commands about a list within an inline-editable-host area.
For instance, this can be used to allow only a certain number of items to be added to a list, 
since the header can contain an inline-editable-button to add an item to the host when count is less than X, 
and a footer could then be used to display a 'buy credits' message when count >= X.

datarepeater
------------
See the documentation use cases above for how this works in detail.  Any element with class "datarepeater" applied will become an auto-async data repeater.

templatedialog
--------------
enhances a link to open a dialog using the data-template using all data attributes on the element within the template instantiation.  For that template to use data loaded from a url it should define an inline-editable-host with the appropriate data attributes.
 
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