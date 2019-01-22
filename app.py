import os

import pandas as pd
import numpy as np

import sqlalchemy
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, func

from flask import Flask, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)


#################################################
# Database Setup
#################################################

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///db/waterdb.sqlite"
db = SQLAlchemy(app)

# reflect an existing database into a new model
Base = automap_base()
# reflect the tables
Base.prepare(db.engine, reflect=True)

# Save references to each table
Aquastat_table = Base.classes.Aquastat_table
WQI_table = Base.classes.WQI_table

## create table in sqlite with index column as primary key
# sqlite> create table `WQITable`(
#     `index` int primary key,
#     `iso` varchar(20),
#     `country` varchar(30),
#     `H2O.current` float);

## show table header in sqlite3
#    .headers on
#    .mode column

# insert into `WQITable`(`iso`,`country`,`H2O.current`)
# select `iso`,`country`,`H2O.current` FROM `WQI_table` ;

#  alter table `WQITable`
#  rename column `H2O.current` to `H2O_current`;

@app.route("/")
def index():
    """Return the homepage."""
    return render_template("index.html")




@app.route("/names")
def names():
    """Return a list of country names and iso."""

    # Use Pandas to perform the sql query
    stmt = db.session.query(Aquastat_table).statement
    aqua_df = pd.read_sql_query(stmt, db.session.bind)

    name_df = aqua_df.drop_duplicates('iso')[['country','iso']]
    # Return a list of the column names (sample names)
    return jsonify( name_df.to_dict('records') ) 


@app.route("/aquadata/<iso>")
def country_aquadata(iso):
    """Return the Aqua stat table data for a given country(by iso code)."""
    #query aquastat table
    sel = [
        Aquastat_table.country,
        Aquastat_table.Variable,
        Aquastat_table.Year,
        Aquastat_table.Value,
        Aquastat_table.unit,
        Aquastat_table.iso,
    ]

    country_stmt = db.session.query(*sel).filter(Aquastat_table.iso == iso).statement
    country_df = pd.read_sql_query(country_stmt, db.session.bind)

    try:  #for some country (Nauru) part of the data is missing, so we skip that by doing this try-except block
        #Build dictionary to return as json
        country_df_grouped = country_df.groupby(['country','Variable'])
        country_aquadata = {}

        country_aquadata['iso'] = iso
        country_aquadata['country'] = country_df['country'].iloc[0]
    
        #index = (country, variable) is a tuple, so index[1] is just country name
        for index, table in country_df_grouped:
            data={}
            data['Year'] = list(table.Year)
            data['Value'] = list(table.Value)
            country_aquadata[index[1]] = data
        #print(sample_metadata)
        return jsonify(country_aquadata)

    except:
        return ""

@app.route("/wqidata/<iso>")
def country_wqidata(iso):
    #query wqi table
    wqi_stmt = db.session.query(WQI_table.iso, WQI_table.H2O_current).filter(WQI_table.iso == iso).statement
    wqi_df = pd.read_sql_query(wqi_stmt, db.session.bind)


    #country_wqidata['wqi'] = wqi_df.iloc[0]['H2O_current']

    return jsonify( wqi_df.to_dict('records') ) 


if __name__ == "__main__":
    app.run()
