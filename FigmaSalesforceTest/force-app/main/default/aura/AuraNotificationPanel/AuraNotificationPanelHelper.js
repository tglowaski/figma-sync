({
    dismiss: function (component) {
        var container = component.find('notifyContainer');
        if (container) {
            $A.util.addClass(container, 'slds-hide');
        }
        component.getEvent('dismiss').fire();
    }
})
