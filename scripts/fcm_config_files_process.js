#!/usr/bin/env node
'use strict';

var fs   = require ( 'fs' );
var path = require ( 'path' );

fs.ensureDirSync = function ( dir ) {
    if ( !fs.existsSync ( dir ) ) {
        dir.split ( path.sep ).reduce ( function ( currentPath, folder ) {
            currentPath += folder + path.sep;
            if ( !fs.existsSync ( currentPath ) ) {
                fs.mkdirSync ( currentPath );
            }
            return currentPath;
        }, '' );
    }
};

var PLATFORM = {
    dest       : [
        'platforms/android/google-services.json',
        'platforms/android/app/google-services.json',
        'platforms/android/app/src/google-services.json'
    ],
    src        : [ 'google-services.json' ],
    stringsXml : 'platforms/android/app/src/main/res/values/strings.xml'
};

if ( directoryExists ( 'platforms/android' ) ) {
    copyKey ( PLATFORM, updateStringsXml )
}

function updateStringsXml ( contents ) {
    var json    = JSON.parse ( contents );
    var strings = fs.readFileSync ( PLATFORM.stringsXml ).toString ();

    // strip non-default value
    strings = strings.replace ( new RegExp ( '<string name="google_app_id">([^\@<]+?)</string>', 'i' ), '' );

    // strip non-default value
    strings = strings.replace ( new RegExp ( '<string name="google_api_key">([^\@<]+?)</string>', 'i' ), '' );

    // strip empty lines
    strings = strings.replace ( new RegExp ( '(\r\n|\n|\r)[ \t]*(\r\n|\n|\r)', 'gm' ), '$1' );

    // replace the default value
    strings = strings.replace ( new RegExp ( '<string name="google_app_id">([^<]+?)</string>', 'i' ), '<string name="google_app_id">' + json.client[ 0 ].client_info.mobilesdk_app_id + '</string>' );

    // replace the default value
    strings = strings.replace ( new RegExp ( '<string name="google_api_key">([^<]+?)</string>', 'i' ), '<string name="google_api_key">' + json.client[ 0 ].api_key[ 0 ].current_key + '</string>' );

    fs.writeFileSync ( PLATFORM.stringsXml, strings );
}

function copyKey ( platform, callback ) {
    for ( var i = 0; i < platform.src.length; i++ ) {
        var file = platform.src[ i ];
        if ( fileExists ( file ) ) {
            try {
                var contents = fs.readFileSync ( file ).toString ();

                try {
                    platform.dest.forEach ( function ( destinationPath ) {
                        var folder = destinationPath.substring ( 0, destinationPath.lastIndexOf ( '/' ) );
                        fs.ensureDirSync ( folder );
                        fs.writeFileSync ( destinationPath, contents );
                    } );
                } catch ( e ) {
                    // skip
                }

                callback && callback ( contents );
            } catch ( err ) {
                console.log ( err )
            }

            break;
        }
    }
}

function getValue ( config, name ) {
    var value = config.match ( new RegExp ( '<' + name + '>(.*?)</' + name + '>', 'i' ) );
    if ( value && value[ 1 ] ) {
        return value[ 1 ]
    } else {
        return null
    }
}

function fileExists ( path ) {
    try {
        return fs.statSync ( path ).isFile ();
    } catch ( e ) {
        return false;
    }
}

function directoryExists ( path ) {
    try {
        return fs.statSync ( path ).isDirectory ();
    } catch ( e ) {
        return false;
    }
}