Vue.component('tasks',
{
    props: ['tasks'],
    data: function () 
    {
        return {};
    },
    updated: function () 
    {
        this.$nextTick(function () 
        {
        });
    },
    template:   
    `
    <div>
    </div>
    `
});