/*
 * Copyright (C) 2012 McEvoy Software Ltd
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
package io.milton.cloud.common;

import static io.milton.context.RequestContext.C;
import io.milton.http.DateUtils;
import java.util.Date;

/**
 * Simple interface to allow externalising the current date, ie for testing
 *
 * @author brad
 */
public interface CurrentDateService {

    public static Date now() {
        Date now = C(CurrentDateService.class).getNow();
        return now;
    }
    
    Date getNow();
    
    /**
     * Should apply localisation per user
     * 
     * @param s
     * @return 
     * @throws io.milton.http.DateUtils.DateParseException 
     */
    Date parseDate(String s) throws DateUtils.DateParseException;
    
}
