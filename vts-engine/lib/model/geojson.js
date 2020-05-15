const Schema = require('mongoose').Schema;

module.exports.polygonSchema = new Schema(
{
    type: 
    {
      type: String,
      enum: ['Polygon'],
      required: true
    },
    coordinates: 
    {
      type: [[[Number]]], // Array of arrays of arrays of numbers
      required: true
    }
});

module.exports.lineSchema = new Schema(
{
    type: 
    {
      type: String,
      enum: ['LineString'],
      required: true
    },
    coordinates: 
    {
      type: [[Number]], // Array of arrays of numbers
      required: true
    }
});

module.exports.pointSchema = new Schema(
{
    type: 
    {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: 
    {
      type: [Number],
      required: true
    }
});