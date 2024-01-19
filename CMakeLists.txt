cmake_minimum_required(VERSION 3.10)
project(GPOS)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED True)
find_package(nlohmann_json 3.2.0 REQUIRED)
add_executable(gpos_sql gpos_sql.cpp)

target_link_libraries(gpos_sql PRIVATE nlohmann_json::nlohmann_json mysqlcppconn)
