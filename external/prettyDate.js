/*
* portions Copyright (c) 2008 John Resig (jquery.com)
* Licensed under the MIT license.
* JavaScript Pretty Date
*
* portions Copyright (c) 2008-2010, Ryan McGeary (ryanonjavascript -[at]- mcgeary [*dot*] org)
* Licensed under the MIT:
* http://www.opensource.org/licenses/mit-license.php
* Timeago is a jQuery plugin that makes it easy to support automatically
* http://timeago.yarp.com/
* updating fuzzy timestamps (e.g. "4 minutes ago" or "about 1 day ago").
*/


// Takes an ISO time and returns a string representing how
// long ago or in the future the date represents.
function prettyDate(time){
    var suffix = 'ago',
        date = new Date(time),
		diff = (((new Date()).getTime() - date.getTime()));

    if (isNaN(diff)) {
        date = new Date((time || "").replace(/-/g, "/").replace(/[TZ]/g, " "));
		diff = (((new Date()).getTime() - date.getTime()));
    }

    if (isNaN(diff)) { return; }
    if (diff < 0) {
        suffix = 'from now';
    }
    diff = Math.abs(diff);

    var seconds = diff / 1000,
        minutes = seconds / 60,
        hours = minutes / 60,
        days = hours / 24,
        years = days / 365;


	return seconds < 60 && Math.round(seconds) + ' seconds ' + suffix ||
        seconds < 120 && '1 minute ' + suffix ||
        minutes < 60 && Math.round(minutes) + ' minutes ' + suffix ||
        minutes < 120 && '1 hour ' + suffix ||
        hours < 24 && Math.round(hours) + ' hours ' + suffix ||
        hours < 48 && '1 day ' + suffix ||
        days < 30 && Math.round(days) + ' days ' + suffix ||
        days < 60 && 'about a month ' + suffix ||
        days < 365 && 'about ' + Math.round(days / 30) + ' months ' + suffix ||
        days < 730 && 'over 1 year ' + suffix ||
        'about ' + Math.round(years) + ' years ' + suffix;
}

// If jQuery is included in the page, adds a jQuery plugin to handle it as well
if ( typeof jQuery != "undefined" )
	jQuery.fn.prettyDate = function(){
		return this.each(function(){
			var date = prettyDate(this.title);
			if ( date )
				jQuery(this).text( date );
		});
	};
