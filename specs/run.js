/**
 * Created by JimBarrows on 7/4/16.
 */
import Jasmine from "jasmine";
import mongoose from "mongoose";

mongoose.Promise = require('bluebird');

mongoose.connect('mongodb://localhost/pinecone');

var jasmine = new Jasmine();
jasmine.loadConfigFile('specs/support/jasmine.json');
jasmine.execute();

