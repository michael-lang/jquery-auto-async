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