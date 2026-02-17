({
    saveRecord: function (component) {
        var action = component.get('c.save');
        action.setCallback(this, function (response) {
            if (response.getState() === 'SUCCESS') {
                component.set('v.mode', 'view');
            }
        });
        $A.enqueueAction(action);
    },
    cancelEdit: function (component) {
        component.set('v.mode', 'view');
    }
})
