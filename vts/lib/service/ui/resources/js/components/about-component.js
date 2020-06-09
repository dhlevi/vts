Vue.component('about',
{
    props: [],
    template:
    `
    <div class="container">
        <h2>The Vivid Topology Service</h2>
        <p>
            The Vivid Topology Service (VTS) is an application that can take spatial data from various sources,
            run a number of topology and attribute related functions over the data, and store them in another
            format. The purpose of VTS is to enable quick, simple ETL of spatial data from one place to another,
            for instance converting shapefiles into KML or storing them in a database.
        </p>
        <p>
            Note: This is a prototype version of VTS. This is not intended for production use. There will be
            bugs, incomplete features, and some features may not function as expected!
        </p>
        <h4>Powered by:</h4>
        <p><a href="https://nodejs.org/en/" target="_blank">NodeJS</a></p>
        <p><a href="https://expressjs.com/" target="_blank">Express</a></p>
        <p><a href="https://vuejs.org/" target="_blank">Vue</a></p>
        <p><a href="https://turfjs.org/" target="_blank">Turf</a></p>
        <p><a href="http://bjornharrtell.github.io/jsts/" target="_blank">JSTS</a></p>
        <p><a href="https://developers.arcgis.com/javascript/" target="_blank">ESRI JS API</a></p>
    </div>
    `
});