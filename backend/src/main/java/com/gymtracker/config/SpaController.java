package com.gymtracker.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Forwards all non-API, non-static requests to index.html so that
 * React Router can handle client-side navigation.
 *
 * Spring Boot serves actual static files (JS, CSS, images) directly
 * from resources/static — this controller only catches routes that
 * don't match any file or @RestController mapping.
 */
@Controller
public class SpaController {

    // Catch everything that:
    //  - doesn't start with /api  (handled by @RestControllers)
    //  - doesn't contain a dot    (so .js, .css, .png etc. are served as files)
    @RequestMapping(value = {
        "/",
        "/{path:^(?!api)[^\\.]*}",
        "/{path:^(?!api)[^\\.]*}/**"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
