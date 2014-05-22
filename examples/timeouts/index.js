// Copyright (C) 2014 IceMobile Agency B.V.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var options = {
    logger: {
        name: 'virgilio',
        streams: []
    },
    http: {
        port: 8081
    }
};
module.exports = require('virgilio')(options)
    //Normally we'd use this, but we can't require virgilio-http
    //from inside its own project.
    //.use('http')
    .loadModule(require('../../'))
    .loadModule(require('./slowdb'));
