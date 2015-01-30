var upkeepScore = upkeepScore || {};

upkeepScore.wizard = (function ($, window, document, autoasync, undefined) {
    function init() {
        autoasync.addCallback(function (prms) {
            //put any custom page enhancements here
            //prms.element is being enhanced
            if ($(prms.element).is(".wizard")) {
                createWizard($(prms.element));
            } else {
                $(prms.element).find(".wizard").each(function(index, item) {
                    createWizard($(item));
                });
            }
        });
    };
    function createWizard(element) {
        if (element.hasClass("expanded")) {
            return;
        }
        var step = $(element).find(".wizard-step").hide()
            .first().show();
        $(element).find(".wizard-navigation .wizard-next")
            .click(function () {
                var current = $(this).closest(".wizard-step");
                if (!autoasync.isValidInputGroup(current)) {
                    return;
                }
                current.next(".wizard-step").show();
                current.hide();
            });
        $(element).find(".wizard-navigation .wizard-previous")
            .click(function () {
                var current = $(this).closest(".wizard-step");
                current.prev(".wizard-step").show();
                current.hide();
            });
    }
    return {
        init: init
    };
}(jQuery, window, document, autoasync));

(function ($, window, document, autoasync, upkeepScore) {
    $(document).ready(function () {
        upkeepScore.wizard.init();
    });
}(jQuery, window, document, autoasync, upkeepScore));